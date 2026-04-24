const { pool, query } = require('../../config/db');
const AppError = require('../../utils/app-error');
const {
  enqueueEmailJob,
  enqueueOrderSheetJob,
} = require('../../jobs/notification.jobs');

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
  if (!couponCode) {
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
    [couponCode]
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
          order_status,
          notes
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 'whatsapp', 'pending', 'pending', ?)
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

    try {
      await enqueueEmailJob({
        to: payload.customer.email,
        subject: `Order received: ${orderNumber}`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h2>Order Received</h2>
            <p>Your order <strong>${orderNumber}</strong> has been placed successfully.</p>
            <p>Status: pending</p>
            <p>Total: ${totalAmount}</p>
          </div>
        `,
      });
    } catch (error) {
      console.error('Failed to enqueue order email:', error.message);
    }

    return {
      orderId,
      orderNumber,
      subtotal: Number(subtotal),
      discountAmount: Number(discountAmount),
      totalAmount: Number(totalAmount),
      status: 'pending',
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function getMyOrders(actor) {
  const ownership = buildOwnedOrderWhere(actor);

  const rows = await query(
    `
      SELECT
        id,
        order_number AS orderNumber,
        order_status AS status,
        payment_status AS paymentStatus,
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

  return rows.map((row) => ({
    id: row.id,
    orderNumber: row.orderNumber,
    status: row.status,
    paymentStatus: row.paymentStatus,
    subtotal: Number(row.subtotal),
    discountAmount: Number(row.discountAmount),
    totalAmount: Number(row.totalAmount),
    placedAt: row.placedAt,
  }));
}

async function getMyOrderByNumber(actor, orderNumber) {
  const ownership = buildOwnedOrderWhere(actor, 'AND order_number = ?');

  const orderRows = await query(
    `
      SELECT
        id,
        order_number AS orderNumber,
        order_status AS status,
        payment_status AS paymentStatus,
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

  const address = parseAddressSnapshot(order.addressSnapshot);
  const name = splitName(order.customerName);

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
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
    })),
  };
}

async function getMyOrderInvoiceHtml(actor, orderNumber) {
  const order = await getMyOrderByNumber(actor, orderNumber);

  const rowsHtml = order.items
    .map(
      (item) => `
        <tr>
          <td style="padding:10px;border:1px solid #ddd;">${item.productName}</td>
          <td style="padding:10px;border:1px solid #ddd;">${item.size}</td>
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
        <title>Invoice ${order.orderNumber}</title>
      </head>
      <body style="font-family: Arial, sans-serif; padding: 32px;">
        <h1>Invoice</h1>
        <p><strong>Order Number:</strong> ${order.orderNumber}</p>
        <p><strong>Status:</strong> ${order.status}</p>
        <p><strong>Customer:</strong> ${order.customerFirstName} ${order.customerLastName}</p>
        <p><strong>Email:</strong> ${order.customerEmail}</p>
        <p><strong>Phone:</strong> ${order.customerPhone}</p>

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
  getMyOrders,
  getMyOrderByNumber,
  getMyOrderInvoiceHtml,
};
