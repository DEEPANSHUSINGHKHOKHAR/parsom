const { pool, query } = require('../../config/db');
const env = require('../../config/env');
const AppError = require('../../utils/app-error');
const {
  createRazorpayOrder,
  verifyRazorpaySignature,
} = require('../../utils/razorpay');
const {
  enqueueOrderSheetJob,
} = require('../../jobs/notification.jobs');
const { ensureStoreSchema } = require('../../utils/store-schema');

function generateOrderNumber() {
  return `PSM-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

function splitName(fullName = '') {
  const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' '),
  };
}

function parseAddressSnapshot(snapshot) {
  if (!snapshot) return {};
  if (typeof snapshot === 'object') return snapshot;

  try {
    return JSON.parse(snapshot);
  } catch {
    return {};
  }
}

function normalizeAddressType(value) {
  const normalized = String(value || '').trim().toLowerCase();
  return ['home', 'work', 'other'].includes(normalized) ? normalized : 'other';
}

async function saveCheckoutAddress(connection, userId, customer) {
  if (!userId || !customer) return;

  const fullName = `${customer.firstName || ''} ${customer.lastName || ''}`.trim();

  const [existingRows] = await connection.execute(
    `
      SELECT id
      FROM addresses
      WHERE user_id = ?
        AND phone = ?
        AND address_line_1 = ?
        AND COALESCE(address_line_2, '') = ?
        AND city = ?
        AND state = ?
        AND postal_code = ?
        AND deleted_at IS NULL
      LIMIT 1
    `,
    [
      userId,
      customer.phone,
      customer.addressLine1,
      customer.addressLine2 || '',
      customer.city,
      customer.state,
      customer.postalCode,
    ]
  );

  if (existingRows[0]) return;

  const [countRows] = await connection.execute(
    `
      SELECT COUNT(*) AS total
      FROM addresses
      WHERE user_id = ?
        AND deleted_at IS NULL
    `,
    [userId]
  );

  const shouldSetDefault = Number(countRows[0].total) === 0;

  await connection.execute(
    `
      INSERT INTO addresses (
        user_id,
        full_name,
        phone,
        address_line_1,
        address_line_2,
        city,
        state,
        postal_code,
        address_type,
        is_default
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      userId,
      fullName,
      customer.phone,
      customer.addressLine1,
      customer.addressLine2 || null,
      customer.city,
      customer.state,
      customer.postalCode,
      normalizeAddressType(customer.addressLabel),
      shouldSetDefault ? 1 : 0,
    ]
  );
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildOwnedOrderWhere(actor, extraCondition = '') {
  const params = [actor.id, actor.email || null, actor.email || null];

  return {
    clause: `
      deleted_at IS NULL
      ${extraCondition}
      AND (
        user_id = ?
        OR (
          user_id IS NULL
          AND ? IS NOT NULL
          AND LOWER(customer_email) = LOWER(?)
        )
      )
    `,
    params,
  };
}

async function validateCoupon(connection, couponCode, subtotal, userId) {
  const normalizedCouponCode = String(couponCode || '').trim().toUpperCase();

  if (!normalizedCouponCode) {
    return {
      coupon: null,
      discountAmount: 0,
    };
  }

  const [couponRows] = await connection.execute(
    `
      SELECT *
      FROM coupons
      WHERE code = ?
        AND deleted_at IS NULL
        AND is_active = 1
        AND (starts_at IS NULL OR starts_at <= NOW())
        AND (ends_at IS NULL OR ends_at >= NOW())
      LIMIT 1
    `,
    [normalizedCouponCode]
  );

  const coupon = couponRows[0];

  if (!coupon) {
    throw new AppError(422, 'Invalid or expired coupon.');
  }

  if (coupon.min_order_amount !== null && Number(subtotal) < Number(coupon.min_order_amount)) {
    throw new AppError(422, 'Order does not meet coupon minimum amount.');
  }

  if (coupon.usage_limit !== null && Number(coupon.used_count) >= Number(coupon.usage_limit)) {
    throw new AppError(422, 'Coupon usage limit reached.');
  }

  if (coupon.usage_per_user !== null && userId) {
    const [usageRows] = await connection.execute(
      `
        SELECT COUNT(*) AS total
        FROM orders
        WHERE user_id = ?
          AND coupon_id = ?
          AND deleted_at IS NULL
      `,
      [userId, coupon.id]
    );

    if (Number(usageRows[0].total) >= Number(coupon.usage_per_user)) {
      throw new AppError(422, 'Per-user coupon usage limit reached.');
    }
  }

  let discountAmount = 0;

  if (coupon.discount_type === 'percentage' || coupon.discount_type === 'percent') {
    discountAmount = (Number(subtotal) * Number(coupon.discount_value)) / 100;
  } else {
    discountAmount = Number(coupon.discount_value);
  }

  if (
    coupon.max_discount_amount !== null &&
    discountAmount > Number(coupon.max_discount_amount)
  ) {
    discountAmount = Number(coupon.max_discount_amount);
  }

  if (discountAmount > Number(subtotal)) {
    discountAmount = Number(subtotal);
  }

  return {
    coupon,
    discountAmount,
  };
}

async function createOrder(payload, actor) {
  await ensureStoreSchema();

  if (!payload?.agreements?.termsAccepted || !payload?.agreements?.returnPolicyAccepted) {
    throw new AppError(
      422,
      'You must accept the return policy and terms before payment.'
    );
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const orderNumber = generateOrderNumber();
    const userId = actor?.role === 'user' ? actor.id : null;

    let subtotal = 0;
    const normalizedItems = [];

    for (const item of payload.items) {
      const [productRows] = await connection.execute(
        `
          SELECT
            p.id,
            p.name,
            p.slug,
            p.original_price,
            p.discount_price,
            p.cost_price,
            p.coming_soon_flag,
            (
              SELECT file_url
              FROM product_images
              WHERE product_id = p.id
                AND deleted_at IS NULL
                AND is_primary = 1
              ORDER BY sort_order ASC, id ASC
              LIMIT 1
            ) AS primary_image
          FROM products p
          WHERE p.id = ?
            AND p.deleted_at IS NULL
            AND p.is_active = 1
          LIMIT 1
        `,
        [item.productId]
      );

      const product = productRows[0];

      if (!product) {
        throw new AppError(404, `Product not found for ID ${item.productId}.`);
      }

      if (Number(product.coming_soon_flag) === 1) {
        throw new AppError(422, `${product.name} is not available for purchase.`);
      }

      const [stockRows] = await connection.execute(
        `
          SELECT
            pv.id AS variant_id,
            pv.size_code,
            ss.id AS stock_id,
            ss.stock_qty,
            ss.reserved_qty
          FROM product_variants pv
          INNER JOIN size_stock ss
            ON ss.product_variant_id = pv.id
          WHERE pv.product_id = ?
            AND pv.size_code = ?
            AND pv.deleted_at IS NULL
            AND pv.is_active = 1
          LIMIT 1
          FOR UPDATE
        `,
        [item.productId, item.size]
      );

      const sizeStock = stockRows[0];

      if (!sizeStock) {
        throw new AppError(422, `Size ${item.size} is not configured for ${product.name}.`);
      }

      const availableStock = Number(sizeStock.stock_qty) - Number(sizeStock.reserved_qty);

      if (availableStock < Number(item.quantity)) {
        throw new AppError(
          422,
          `Insufficient stock for ${product.name} (${item.size}).`
        );
      }

      const finalPrice =
        product.discount_price !== null
          ? Number(product.discount_price)
          : Number(product.original_price);

      const lineTotal = finalPrice * Number(item.quantity);
      subtotal += lineTotal;

      normalizedItems.push({
        productId: product.id,
        productVariantId: sizeStock.variant_id,
        productName: product.name,
        productSlug: product.slug,
        primaryImage: product.primary_image,
        sizeCode: sizeStock.size_code,
        quantity: Number(item.quantity),
        unitPrice: Number(product.original_price),
        discountPrice:
          product.discount_price !== null ? Number(product.discount_price) : null,
        finalPrice,
        costPrice: product.cost_price !== null ? Number(product.cost_price) : null,
        lineTotal,
        stockId: sizeStock.stock_id,
      });
    }

    const { coupon, discountAmount } = await validateCoupon(
      connection,
      payload.couponCode || null,
      subtotal,
      userId
    );

    const totalAmount = Number(subtotal) - Number(discountAmount);
    await saveCheckoutAddress(connection, userId, payload.customer);

    const razorpayOrder = await createRazorpayOrder({
      orderNumber,
      amount: totalAmount,
    });
    const customerName = `${payload.customer.firstName} ${payload.customer.lastName}`.trim();
    const addressSnapshot = {
      firstName: payload.customer.firstName,
      lastName: payload.customer.lastName,
      phone: payload.customer.phone,
      addressLine1: payload.customer.addressLine1,
      addressLine2: payload.customer.addressLine2 || '',
      city: payload.customer.city,
      state: payload.customer.state,
      postalCode: payload.customer.postalCode,
      addressLabel: payload.customer.addressLabel || '',
      notes: payload.customer.notes || '',
    };

    const [orderInsert] = await connection.execute(
      `
        INSERT INTO orders (
          order_number,
          user_id,
          coupon_id,
          customer_name,
          customer_email,
          customer_phone,
          address_snapshot,
          subtotal_amount,
          discount_amount,
          shipping_amount,
          total_amount,
          payment_method,
          payment_status,
          razorpay_order_id,
          order_status,
          notes,
          terms_accepted_at,
          return_policy_accepted_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 'razorpay', 'pending', ?, 'pending', ?, NOW(), NOW())
      `,
      [
        orderNumber,
        userId,
        coupon ? coupon.id : null,
        customerName,
        payload.customer.email,
        payload.customer.phone,
        JSON.stringify(addressSnapshot),
        subtotal,
        discountAmount,
        totalAmount,
        razorpayOrder.id,
        payload.customer.notes || null,
      ]
    );

    const orderId = orderInsert.insertId;

    for (const item of normalizedItems) {
      await connection.execute(
        `
          INSERT INTO order_items (
            order_id,
            product_id,
            product_variant_id,
            product_name,
            product_slug,
            size_code,
            quantity,
            unit_price,
            discount_price,
            final_price,
            cost_price,
            item_total
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          orderId,
          item.productId,
          item.productVariantId,
          item.productName,
          item.productSlug,
          item.sizeCode,
          item.quantity,
          item.unitPrice,
          item.discountPrice,
          item.finalPrice,
          item.costPrice,
          item.lineTotal,
        ]
      );

      await connection.execute(
        `
          UPDATE size_stock
          SET stock_qty = stock_qty - ?,
              stock_status = CASE
                WHEN stock_qty - ? <= 0 THEN 'out_of_stock'
                WHEN stock_qty - ? <= low_stock_threshold THEN 'low_stock'
                ELSE 'in_stock'
              END
          WHERE id = ?
        `,
        [item.quantity, item.quantity, item.quantity, item.stockId]
      );
    }

    if (coupon) {
      await connection.execute(
        `
          UPDATE coupons
          SET used_count = used_count + 1
          WHERE id = ?
        `,
        [coupon.id]
      );
    }

    await connection.commit();

    const orderSummary = {
      orderNumber,
      customerFirstName: payload.customer.firstName,
      customerLastName: payload.customer.lastName,
      customerEmail: payload.customer.email,
      customerPhone: payload.customer.phone,
      status: 'pending',
      subtotal: Number(subtotal),
      discountAmount: Number(discountAmount),
      totalAmount: Number(totalAmount),
      placedAt: new Date().toISOString(),
    };

    try {
      await enqueueOrderSheetJob(orderSummary);
    } catch (error) {
      console.error('Failed to enqueue order sheets job:', error.message);
    }

    return {
      orderId,
      orderNumber,
      subtotal: Number(subtotal),
      discountAmount: Number(discountAmount),
      totalAmount: Number(totalAmount),
      status: 'pending',
      paymentStatus: 'pending',
      paymentMethod: 'razorpay',
      razorpay: {
        keyId: env.RAZORPAY_KEY_ID,
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency || 'INR',
      },
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function verifyOrderPayment(payload) {
  const isValidSignature = verifyRazorpaySignature(payload);

  if (!isValidSignature) {
    throw new AppError(422, 'Payment verification failed.');
  }

  const rows = await query(
    `
      SELECT
        id,
        order_number AS orderNumber,
        payment_status AS paymentStatus,
        razorpay_order_id AS razorpayOrderId
      FROM orders
      WHERE order_number = ?
        AND razorpay_order_id = ?
        AND deleted_at IS NULL
      LIMIT 1
    `,
    [payload.orderNumber, payload.razorpayOrderId]
  );

  const order = rows[0];

  if (!order) {
    throw new AppError(404, 'Order not found for this payment.');
  }

  if (order.paymentStatus !== 'paid') {
    await query(
      `
        UPDATE orders
        SET payment_status = 'paid',
            order_status = CASE
              WHEN order_status = 'pending' THEN 'confirmed'
              ELSE order_status
            END,
            razorpay_payment_id = ?,
            razorpay_signature = ?,
            paid_at = NOW(),
            updated_at = NOW()
        WHERE id = ?
      `,
      [
        payload.razorpayPaymentId,
        payload.razorpaySignature,
        order.id,
      ]
    );
  }

  return {
    orderNumber: order.orderNumber,
    paymentStatus: 'paid',
    status: 'confirmed',
  };
}

async function getMyOrders(actor) {
  await ensureStoreSchema();

  const ownership = buildOwnedOrderWhere(actor);

  const rows = await query(
    `
      SELECT
        id,
        order_number AS orderNumber,
        order_status AS status,
        payment_method AS paymentMethod,
        payment_status AS paymentStatus,
        razorpay_order_id AS razorpayOrderId,
        razorpay_payment_id AS razorpayPaymentId,
        paid_at AS paidAt,
        subtotal_amount AS subtotal,
        discount_amount AS discountAmount,
        total_amount AS totalAmount,
        ordered_at AS placedAt
      FROM orders
      WHERE ${ownership.clause}
      ORDER BY created_at DESC
    `,
    ownership.params
  );

  if (!rows.length) {
    return [];
  }

  const orderIds = rows.map((row) => row.id);
  const itemRows = await query(
    `
      SELECT
        oi.id,
        oi.order_id AS orderId,
        oi.product_id AS productId,
        oi.product_name AS productName,
        oi.product_slug AS productSlug,
        (
          SELECT pi.file_url
          FROM product_images pi
          WHERE pi.product_id = oi.product_id
            AND pi.deleted_at IS NULL
            AND pi.is_primary = 1
          ORDER BY pi.sort_order ASC, pi.id ASC
          LIMIT 1
        ) AS primaryImage,
        (
          SELECT pi.media_type
          FROM product_images pi
          WHERE pi.product_id = oi.product_id
            AND pi.deleted_at IS NULL
            AND pi.is_primary = 1
          ORDER BY pi.sort_order ASC, pi.id ASC
          LIMIT 1
        ) AS primaryMediaType,
        oi.size_code AS size,
        oi.quantity,
        oi.final_price AS unitPrice,
        oi.item_total AS lineTotal
      FROM order_items oi
      WHERE oi.order_id IN (${orderIds.map(() => '?').join(',')})
      ORDER BY oi.order_id ASC, oi.id ASC
    `,
    orderIds
  );

  const itemsByOrderId = itemRows.reduce((acc, item) => {
    const orderItems = acc.get(item.orderId) || [];
    orderItems.push({
      id: item.id,
      productId: item.productId,
      productName: item.productName,
      productSlug: item.productSlug,
      primaryImage: item.primaryImage,
      primaryMediaType: item.primaryMediaType || 'image',
      size: item.size,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      lineTotal: Number(item.lineTotal),
    });
    acc.set(item.orderId, orderItems);
    return acc;
  }, new Map());

  const returnRows = await query(
    `
      SELECT
        order_item_id AS orderItemId,
        status,
        reason,
        created_at AS createdAt
      FROM return_requests
      WHERE deleted_at IS NULL
        AND user_id = ?
    `,
    [actor.id]
  );

  const returnByOrderItemId = new Map(
    returnRows.map((row) => [
      Number(row.orderItemId),
      {
        status: row.status,
        reason: row.reason,
        createdAt: row.createdAt,
      },
    ])
  );

  return rows.map((row) => ({
    id: row.id,
    orderNumber: row.orderNumber,
    status: row.status,
    paymentMethod: row.paymentMethod,
    paymentStatus: row.paymentStatus,
    razorpayOrderId: row.razorpayOrderId,
    razorpayPaymentId: row.razorpayPaymentId,
    paidAt: row.paidAt,
    subtotal: Number(row.subtotal),
    discountAmount: Number(row.discountAmount),
    totalAmount: Number(row.totalAmount),
    placedAt: row.placedAt,
    items: (itemsByOrderId.get(row.id) || []).map((item) => ({
      ...item,
      returnRequest: returnByOrderItemId.get(Number(item.id)) || null,
    })),
  }));
}

async function getMyOrderByNumber(actor, orderNumber) {
  await ensureStoreSchema();

  const ownership = buildOwnedOrderWhere(actor, 'AND order_number = ?');

  const orderRows = await query(
    `
      SELECT
        id,
        order_number AS orderNumber,
        order_status AS status,
        payment_method AS paymentMethod,
        payment_status AS paymentStatus,
        razorpay_order_id AS razorpayOrderId,
        razorpay_payment_id AS razorpayPaymentId,
        paid_at AS paidAt,
        customer_name AS customerName,
        customer_email AS customerEmail,
        customer_phone AS customerPhone,
        address_snapshot AS addressSnapshot,
        notes,
        subtotal_amount AS subtotal,
        discount_amount AS discountAmount,
        total_amount AS totalAmount,
        ordered_at AS placedAt
      FROM orders
      WHERE ${ownership.clause}
      LIMIT 1
    `,
    [orderNumber, ...ownership.params]
  );

  const order = orderRows[0];

  if (!order) {
    throw new AppError(404, 'Order not found.');
  }

  const items = await query(
    `
      SELECT
        oi.product_id AS productId,
        oi.product_name AS productName,
        oi.product_slug AS productSlug,
        (
          SELECT pi.file_url
          FROM product_images pi
          WHERE pi.product_id = oi.product_id
            AND pi.deleted_at IS NULL
            AND pi.is_primary = 1
          ORDER BY pi.sort_order ASC, pi.id ASC
          LIMIT 1
        ) AS primaryImage,
        oi.size_code AS size,
        oi.quantity,
        oi.final_price AS unitPrice,
        oi.unit_price AS originalPrice,
        oi.discount_price AS discountPrice,
        oi.item_total AS lineTotal
      FROM order_items oi
      WHERE oi.order_id = ?
      ORDER BY oi.id ASC
    `,
    [order.id]
  );

  const returnRows = await query(
    `
      SELECT
        id,
        order_item_id AS orderItemId,
        status,
        reason,
        admin_notes AS adminNotes,
        created_at AS createdAt
      FROM return_requests
      WHERE deleted_at IS NULL
        AND user_id = ?
        AND order_id = ?
    `,
    [actor.id, order.id]
  );
  const returnByOrderItemId = new Map(
    returnRows.map((row) => [
      Number(row.orderItemId),
      {
        id: Number(row.id),
        status: row.status,
        reason: row.reason,
        adminNotes: row.adminNotes,
        createdAt: row.createdAt,
      },
    ])
  );

  const address = parseAddressSnapshot(order.addressSnapshot);
  const name = splitName(order.customerName);

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    razorpayOrderId: order.razorpayOrderId,
    razorpayPaymentId: order.razorpayPaymentId,
    paidAt: order.paidAt,
    customerFirstName: address.firstName || name.firstName,
    customerLastName: address.lastName || name.lastName,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone,
    addressLine1: address.addressLine1 || '',
    addressLine2: address.addressLine2 || '',
    city: address.city || '',
    state: address.state || '',
    postalCode: address.postalCode || '',
    addressLabel: address.addressLabel || address.label || '',
    notes: order.notes,
    subtotal: Number(order.subtotal),
    discountAmount: Number(order.discountAmount),
    totalAmount: Number(order.totalAmount),
    placedAt: order.placedAt,
    items: items.map((item) => ({
      ...item,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      originalPrice: Number(item.originalPrice),
      discountPrice: item.discountPrice !== null ? Number(item.discountPrice) : null,
      lineTotal: Number(item.lineTotal),
      returnRequest: returnByOrderItemId.get(Number(item.id)) || null,
    })),
  };
}

async function listMyReturnRequests(actor) {
  await ensureStoreSchema();

  const rows = await query(
    `
      SELECT
        rr.id,
        rr.order_item_id AS orderItemId,
        rr.order_number_snapshot AS orderNumber,
        rr.product_name_snapshot AS productName,
        rr.size_label AS size,
        rr.reason,
        rr.status,
        rr.admin_notes AS adminNotes,
        rr.created_at AS createdAt
      FROM return_requests rr
      WHERE rr.user_id = ?
        AND rr.deleted_at IS NULL
      ORDER BY rr.created_at DESC
    `,
    [actor.id]
  );

  return rows.map((row) => ({
    id: Number(row.id),
    orderItemId: Number(row.orderItemId),
    orderNumber: row.orderNumber,
    productName: row.productName,
    size: row.size,
    reason: row.reason,
    status: row.status,
    adminNotes: row.adminNotes,
    createdAt: row.createdAt,
  }));
}

async function createReturnRequest(actor, payload) {
  await ensureStoreSchema();

  const eligibleRows = await query(
    `
      SELECT
        oi.id AS orderItemId,
        oi.order_id AS orderId,
        oi.product_id AS productId,
        oi.product_name AS productName,
        oi.size_code AS size,
        o.order_number AS orderNumber
      FROM order_items oi
      INNER JOIN orders o
        ON o.id = oi.order_id
      WHERE oi.id = ?
        AND o.user_id = ?
        AND o.deleted_at IS NULL
        AND o.order_status = 'delivered'
      LIMIT 1
    `,
    [payload.orderItemId, actor.id]
  );

  const eligibleItem = eligibleRows[0];

  if (!eligibleItem) {
    throw new AppError(422, 'Returns can only be requested for delivered orders.');
  }

  const existingRows = await query(
    `
      SELECT id
      FROM return_requests
      WHERE order_item_id = ?
        AND user_id = ?
        AND deleted_at IS NULL
        AND status <> 'rejected'
      LIMIT 1
    `,
    [payload.orderItemId, actor.id]
  );

  if (existingRows[0]) {
    throw new AppError(409, 'A return request already exists for this order item.');
  }

  const result = await query(
    `
      INSERT INTO return_requests (
        user_id,
        order_id,
        order_item_id,
        product_id,
        order_number_snapshot,
        product_name_snapshot,
        size_label,
        reason,
        status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `,
    [
      actor.id,
      eligibleItem.orderId,
      eligibleItem.orderItemId,
      eligibleItem.productId,
      eligibleItem.orderNumber,
      eligibleItem.productName,
      eligibleItem.size,
      payload.reason,
    ]
  );

  return {
    returnRequestId: Number(result.insertId),
    orderItemId: Number(eligibleItem.orderItemId),
    orderNumber: eligibleItem.orderNumber,
    productName: eligibleItem.productName,
    size: eligibleItem.size,
    reason: payload.reason,
    status: 'pending',
  };
}

async function getMyOrderInvoiceHtml(actor, orderNumber) {
  const order = await getMyOrderByNumber(actor, orderNumber);

  const rowsHtml = order.items
    .map(
      (item) => `
        <tr>
          <td style="padding:10px;border:1px solid #ddd;">${escapeHtml(item.productName)}</td>
          <td style="padding:10px;border:1px solid #ddd;">${escapeHtml(item.size)}</td>
          <td style="padding:10px;border:1px solid #ddd;">${item.quantity}</td>
          <td style="padding:10px;border:1px solid #ddd;">${item.unitPrice}</td>
          <td style="padding:10px;border:1px solid #ddd;">${item.lineTotal}</td>
        </tr>
      `
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Invoice ${escapeHtml(order.orderNumber)}</title>
      </head>
      <body style="font-family: Arial, sans-serif; padding: 32px;">
        <h1>Invoice</h1>
        <p><strong>Order Number:</strong> ${escapeHtml(order.orderNumber)}</p>
        <p><strong>Status:</strong> ${escapeHtml(order.status)}</p>
        <p><strong>Payment Status:</strong> ${escapeHtml(order.paymentStatus)}</p>
        <p><strong>Razorpay Order ID:</strong> ${escapeHtml(order.razorpayOrderId || 'Not available')}</p>
        <p><strong>Razorpay Transaction ID:</strong> ${escapeHtml(order.razorpayPaymentId || 'Pending')}</p>
        <p><strong>Paid At:</strong> ${escapeHtml(order.paidAt || 'Not available')}</p>
        <p><strong>Customer:</strong> ${escapeHtml(order.customerFirstName)} ${escapeHtml(order.customerLastName)}</p>
        <p><strong>Email:</strong> ${escapeHtml(order.customerEmail)}</p>
        <p><strong>Phone:</strong> ${escapeHtml(order.customerPhone)}</p>

        <table style="width:100%;border-collapse:collapse;margin-top:24px;">
          <thead>
            <tr>
              <th style="padding:10px;border:1px solid #ddd;text-align:left;">Product</th>
              <th style="padding:10px;border:1px solid #ddd;text-align:left;">Size</th>
              <th style="padding:10px;border:1px solid #ddd;text-align:left;">Qty</th>
              <th style="padding:10px;border:1px solid #ddd;text-align:left;">Unit Price</th>
              <th style="padding:10px;border:1px solid #ddd;text-align:left;">Line Total</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div style="margin-top:24px;">
          <p><strong>Subtotal:</strong> ${order.subtotal}</p>
          <p><strong>Discount:</strong> ${order.discountAmount}</p>
          <p><strong>Total:</strong> ${order.totalAmount}</p>
        </div>
      </body>
    </html>
  `;
}

module.exports = {
  createOrder,
  verifyOrderPayment,
  getMyOrders,
  getMyOrderByNumber,
  listMyReturnRequests,
  createReturnRequest,
  getMyOrderInvoiceHtml,
};
