const { pool, query } = require('../../config/db');
const AppError = require('../../utils/app-error');
const { enqueueEmailJob } = require('../../jobs/notification.jobs');

function productStatus(row) {
  if (Number(row.coming_soon_flag) === 1) return 'coming_soon';
  return Number(row.is_active) === 1 ? 'active' : 'inactive';
}

function productFlagsFromStatus(status, isActive = true) {
  return {
    isActive: status ? status !== 'inactive' : isActive,
    isComingSoon: status === 'coming_soon',
  };
}

function splitCustomerName(name = '') {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
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

async function ensureUniqueProductSlug(connection, slug, excludeProductId = null) {
  const sql = excludeProductId
    ? `
      SELECT id
      FROM products
      WHERE slug = ?
        AND deleted_at IS NULL
        AND id <> ?
      LIMIT 1
    `
    : `
      SELECT id
      FROM products
      WHERE slug = ?
        AND deleted_at IS NULL
      LIMIT 1
    `;

  const params = excludeProductId ? [slug, excludeProductId] : [slug];
  const [rows] = await connection.execute(sql, params);

  if (rows[0]) {
    throw new AppError(409, 'Product slug already exists.');
  }
}

async function replaceProductImages(connection, productId, images = []) {
  await connection.execute(
    `
      UPDATE product_images
      SET deleted_at = NOW()
      WHERE product_id = ?
        AND deleted_at IS NULL
    `,
    [productId]
  );

  for (const image of images) {
    await connection.execute(
      `
        INSERT INTO product_images (
          product_id,
          media_type,
          file_url,
          alt_text,
          is_primary,
          is_secondary,
          sort_order
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        productId,
        image.type || 'image',
        image.url,
        image.alt || null,
        image.isPrimary ? 1 : 0,
        image.isSecondary ? 1 : 0,
        image.sortOrder || 0,
      ]
    );
  }
}

async function replaceProductSizes(connection, productId, sizes = [], skuPrefix = 'PSM') {
  const activeSizes = sizes
    .filter((item) => item.size)
    .map((item) => String(item.size).trim().toUpperCase());

  if (activeSizes.length > 0) {
    await connection.execute(
      `
        UPDATE product_variants
        SET is_active = 0,
            deleted_at = NOW()
        WHERE product_id = ?
          AND deleted_at IS NULL
          AND size_code NOT IN (${activeSizes.map(() => '?').join(', ')})
      `,
      [productId, ...activeSizes]
    );
  } else {
    await connection.execute(
      `
        UPDATE product_variants
        SET is_active = 0,
            deleted_at = NOW()
        WHERE product_id = ?
          AND deleted_at IS NULL
      `,
      [productId]
    );
  }

  for (const sizeItem of sizes) {
    const sizeCode = String(sizeItem.size || '').trim().toUpperCase();
    if (!sizeCode) continue;

    const [variantRows] = await connection.execute(
      `
        SELECT id
        FROM product_variants
        WHERE product_id = ?
          AND size_code = ?
        LIMIT 1
      `,
      [productId, sizeCode]
    );

    let variantId = variantRows[0]?.id;
    const sku = `${skuPrefix || `PSM-${productId}`}-${sizeCode}`;

    if (variantId) {
      await connection.execute(
        `
          UPDATE product_variants
          SET sku = ?,
              is_active = ?,
              deleted_at = NULL,
              updated_at = NOW()
          WHERE id = ?
        `,
        [sku, sizeItem.isActive === false ? 0 : 1, variantId]
      );
    } else {
      const [insertResult] = await connection.execute(
        `
          INSERT INTO product_variants (product_id, size_code, sku, is_active)
          VALUES (?, ?, ?, ?)
        `,
        [productId, sizeCode, sku, sizeItem.isActive === false ? 0 : 1]
      );
      variantId = insertResult.insertId;
    }

    const stockStatus =
      Number(sizeItem.stockQty || 0) <= 0
        ? 'out_of_stock'
        : Number(sizeItem.stockQty || 0) <= Number(sizeItem.lowStockThreshold || 5)
          ? 'low_stock'
          : 'in_stock';

    const [stockRows] = await connection.execute(
      'SELECT id FROM size_stock WHERE product_variant_id = ? LIMIT 1',
      [variantId]
    );

    if (stockRows[0]) {
      await connection.execute(
        `
          UPDATE size_stock
          SET stock_qty = ?,
              reserved_qty = ?,
              low_stock_threshold = ?,
              stock_status = ?
          WHERE product_variant_id = ?
        `,
        [
          Number(sizeItem.stockQty || 0),
          Number(sizeItem.reservedQty || 0),
          Number(sizeItem.lowStockThreshold || 5),
          stockStatus,
          variantId,
        ]
      );
    } else {
      await connection.execute(
        `
          INSERT INTO size_stock (
            product_variant_id,
            stock_qty,
            reserved_qty,
            low_stock_threshold,
            stock_status
          )
          VALUES (?, ?, ?, ?, ?)
        `,
        [
          variantId,
          Number(sizeItem.stockQty || 0),
          Number(sizeItem.reservedQty || 0),
          Number(sizeItem.lowStockThreshold || 5),
          stockStatus,
        ]
      );
    }
  }
}

async function listAdminProducts(filters) {
  const conditions = ['p.deleted_at IS NULL'];
  const params = [];

  if (filters.search) {
    conditions.push('(p.name LIKE ? OR p.slug LIKE ?)');
    const term = `%${filters.search}%`;
    params.push(term, term);
  }

  if (filters.status === 'active') {
    conditions.push('p.is_active = 1 AND p.coming_soon_flag = 0');
  } else if (filters.status === 'inactive') {
    conditions.push('p.is_active = 0');
  } else if (filters.status === 'coming_soon') {
    conditions.push('p.coming_soon_flag = 1');
  }

  if (filters.categoryId) {
    conditions.push('p.category_id = ?');
    params.push(filters.categoryId);
  }

  const rows = await query(
    `
      SELECT
        p.id,
        p.name,
        p.slug,
        p.original_price AS price,
        p.discount_price AS discountPrice,
        p.cost_price AS costPrice,
        p.is_active,
        p.featured_flag AS isFeatured,
        p.trending_flag AS isTrending,
        p.coming_soon_flag,
        p.created_at AS createdAt,
        c.name AS categoryName,
        (
          SELECT file_url
          FROM product_images pi
          WHERE pi.product_id = p.id
            AND pi.deleted_at IS NULL
            AND pi.is_primary = 1
          ORDER BY pi.sort_order ASC, pi.id ASC
          LIMIT 1
        ) AS primaryImage,
        COALESCE(stock.availableStock, 0) AS availableStock
      FROM products p
      LEFT JOIN categories c
        ON c.id = p.category_id
      LEFT JOIN (
        SELECT
          pv.product_id,
          SUM(GREATEST(ss.stock_qty - ss.reserved_qty, 0)) AS availableStock
        FROM product_variants pv
        INNER JOIN size_stock ss
          ON ss.product_variant_id = pv.id
        WHERE pv.deleted_at IS NULL
          AND pv.is_active = 1
        GROUP BY pv.product_id
      ) stock ON stock.product_id = p.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY p.created_at DESC
    `,
    params
  );

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    status: productStatus(row),
    price: Number(row.price),
    discountPrice: row.discountPrice !== null ? Number(row.discountPrice) : null,
    costPrice: row.costPrice !== null ? Number(row.costPrice) : null,
    isActive: Boolean(row.is_active),
    isFeatured: Boolean(row.isFeatured),
    isTrending: Boolean(row.isTrending),
    createdAt: row.createdAt,
    categoryName: row.categoryName,
    primaryImage: row.primaryImage,
    availableStock: Number(row.availableStock || 0),
  }));
}

async function getAdminProductById(productId) {
  const rows = await query(
    `
      SELECT
        p.*,
        c.name AS categoryName
      FROM products p
      LEFT JOIN categories c
        ON c.id = p.category_id
      WHERE p.id = ?
        AND p.deleted_at IS NULL
      LIMIT 1
    `,
    [productId]
  );

  const product = rows[0];

  if (!product) {
    throw new AppError(404, 'Product not found.');
  }

  const media = await query(
    `
      SELECT
        id,
        media_type AS type,
        file_url AS url,
        alt_text AS alt,
        is_primary AS isPrimary,
        is_secondary AS isSecondary,
        sort_order AS sortOrder
      FROM product_images
      WHERE product_id = ?
        AND deleted_at IS NULL
      ORDER BY sort_order ASC, id ASC
    `,
    [productId]
  );

  const sizes = await query(
    `
      SELECT
        pv.id,
        pv.size_code AS size,
        ss.stock_qty AS stockQty,
        ss.reserved_qty AS reservedQty,
        ss.low_stock_threshold AS lowStockThreshold,
        pv.is_active AS isActive
      FROM product_variants pv
      LEFT JOIN size_stock ss
        ON ss.product_variant_id = pv.id
      WHERE pv.product_id = ?
        AND pv.deleted_at IS NULL
      ORDER BY FIELD(pv.size_code, 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'), pv.id ASC
    `,
    [productId]
  );

  return {
    id: product.id,
    categoryId: product.category_id,
    categoryName: product.categoryName,
    name: product.name,
    slug: product.slug,
    shortDescription: product.short_description,
    description: product.description,
    materialDetails: '',
    careDetails: '',
    shippingNotes: '',
    price: Number(product.original_price),
    discountPrice: product.discount_price !== null ? Number(product.discount_price) : null,
    costPrice: product.cost_price !== null ? Number(product.cost_price) : null,
    status: productStatus(product),
    isActive: Boolean(product.is_active),
    isFeatured: Boolean(product.featured_flag),
    isTrending: Boolean(product.trending_flag),
    videoUrl: '',
    seoTitle: product.seo_title,
    seoDescription: product.seo_description,
    seoImage: '',
    sortOrder: 0,
    media: media.map((item) => ({
      id: item.id,
      type: item.type,
      url: item.url,
      alt: item.alt,
      isPrimary: Boolean(item.isPrimary),
      isSecondary: Boolean(item.isSecondary),
      sortOrder: Number(item.sortOrder),
    })),
    sizes: sizes.map((item) => ({
      id: item.id,
      size: item.size,
      stockQty: Number(item.stockQty || 0),
      reservedQty: Number(item.reservedQty || 0),
      lowStockThreshold: Number(item.lowStockThreshold || 5),
      isActive: Boolean(item.isActive),
    })),
  };
}

async function createAdminProduct(payload) {
  if (!payload.categoryId) {
    throw new AppError(422, 'Category is required.');
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    await ensureUniqueProductSlug(connection, payload.slug);

    const flags = productFlagsFromStatus(payload.status, payload.isActive !== false);
    const discountPercent =
      payload.discountPrice && Number(payload.price) > 0
        ? Math.max(0, ((Number(payload.price) - Number(payload.discountPrice)) / Number(payload.price)) * 100)
        : 0;

    const [insertResult] = await connection.execute(
      `
        INSERT INTO products (
          category_id,
          name,
          slug,
          short_description,
          description,
          original_price,
          discount_price,
          discount_percent,
          cost_price,
          sku_prefix,
          featured_flag,
          trending_flag,
          coming_soon_flag,
          is_active,
          published_at,
          seo_title,
          seo_description
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?)
      `,
      [
        payload.categoryId,
        payload.name,
        payload.slug,
        payload.shortDescription || null,
        payload.description || null,
        payload.price,
        payload.discountPrice ?? null,
        discountPercent,
        payload.costPrice ?? null,
        payload.skuPrefix || payload.slug.toUpperCase().replace(/[^A-Z0-9]+/g, '-'),
        payload.isFeatured ? 1 : 0,
        payload.isTrending ? 1 : 0,
        flags.isComingSoon ? 1 : 0,
        flags.isActive ? 1 : 0,
        payload.seoTitle || null,
        payload.seoDescription || null,
      ]
    );

    const productId = insertResult.insertId;

    if (Array.isArray(payload.images)) {
      await replaceProductImages(connection, productId, payload.images);
    }

    if (Array.isArray(payload.sizes)) {
      await replaceProductSizes(
        connection,
        productId,
        payload.sizes,
        payload.skuPrefix || payload.slug.toUpperCase().replace(/[^A-Z0-9]+/g, '-')
      );
    }

    await connection.commit();
    return { productId };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function updateAdminProduct(productId, payload) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [existingRows] = await connection.execute(
      `
        SELECT *
        FROM products
        WHERE id = ?
          AND deleted_at IS NULL
        LIMIT 1
      `,
      [productId]
    );

    const existing = existingRows[0];

    if (!existing) {
      throw new AppError(404, 'Product not found.');
    }

    if (payload.slug && payload.slug !== existing.slug) {
      await ensureUniqueProductSlug(connection, payload.slug, productId);
    }

    const nextPrice = payload.price !== undefined ? payload.price : existing.original_price;
    const nextDiscount =
      payload.discountPrice !== undefined ? payload.discountPrice : existing.discount_price;
    const flags = productFlagsFromStatus(
      payload.status || productStatus(existing),
      payload.isActive !== undefined ? payload.isActive : Boolean(existing.is_active)
    );
    const discountPercent =
      nextDiscount && Number(nextPrice) > 0
        ? Math.max(0, ((Number(nextPrice) - Number(nextDiscount)) / Number(nextPrice)) * 100)
        : 0;

    await connection.execute(
      `
        UPDATE products
        SET category_id = ?,
            name = ?,
            slug = ?,
            short_description = ?,
            description = ?,
            original_price = ?,
            discount_price = ?,
            discount_percent = ?,
            cost_price = ?,
            sku_prefix = ?,
            featured_flag = ?,
            trending_flag = ?,
            coming_soon_flag = ?,
            is_active = ?,
            seo_title = ?,
            seo_description = ?,
            updated_at = NOW()
        WHERE id = ?
      `,
      [
        payload.categoryId !== undefined ? payload.categoryId : existing.category_id,
        payload.name ?? existing.name,
        payload.slug ?? existing.slug,
        payload.shortDescription ?? existing.short_description,
        payload.description ?? existing.description,
        nextPrice,
        nextDiscount,
        discountPercent,
        payload.costPrice !== undefined ? payload.costPrice : existing.cost_price,
        payload.skuPrefix || existing.sku_prefix || (payload.slug ?? existing.slug).toUpperCase().replace(/[^A-Z0-9]+/g, '-'),
        payload.isFeatured !== undefined ? (payload.isFeatured ? 1 : 0) : existing.featured_flag,
        payload.isTrending !== undefined ? (payload.isTrending ? 1 : 0) : existing.trending_flag,
        flags.isComingSoon ? 1 : 0,
        flags.isActive ? 1 : 0,
        payload.seoTitle !== undefined ? payload.seoTitle : existing.seo_title,
        payload.seoDescription !== undefined ? payload.seoDescription : existing.seo_description,
        productId,
      ]
    );

    if (Array.isArray(payload.images)) {
      await replaceProductImages(connection, productId, payload.images);
    }

    if (Array.isArray(payload.sizes)) {
      await replaceProductSizes(
        connection,
        productId,
        payload.sizes,
        payload.skuPrefix || existing.sku_prefix || (payload.slug ?? existing.slug).toUpperCase().replace(/[^A-Z0-9]+/g, '-')
      );
    }

    await connection.commit();
    return { productId: Number(productId) };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function softDeleteAdminProduct(productId) {
  const existingRows = await query(
    `
      SELECT id
      FROM products
      WHERE id = ?
        AND deleted_at IS NULL
      LIMIT 1
    `,
    [productId]
  );

  if (!existingRows[0]) {
    throw new AppError(404, 'Product not found.');
  }

  await query(
    `
      UPDATE products
      SET deleted_at = NOW(),
          is_active = 0
      WHERE id = ?
    `,
    [productId]
  );

  return { productId: Number(productId) };
}

async function listAdminOrders(filters) {
  const conditions = ['o.deleted_at IS NULL'];
  const params = [];

  if (filters.status) {
    conditions.push('o.order_status = ?');
    params.push(filters.status);
  }

  if (filters.search) {
    conditions.push(
      '(o.order_number LIKE ? OR o.customer_name LIKE ? OR o.customer_email LIKE ? OR o.customer_phone LIKE ?)'
    );
    const term = `%${filters.search}%`;
    params.push(term, term, term, term);
  }

  const rows = await query(
    `
      SELECT
        o.id,
        o.order_number AS orderNumber,
        o.customer_name AS customerName,
        o.customer_email AS customerEmail,
        o.customer_phone AS customerPhone,
        o.order_status AS status,
        o.payment_status AS paymentStatus,
        o.subtotal_amount AS subtotal,
        o.discount_amount AS discountAmount,
        o.total_amount AS totalAmount,
        o.tracking_code AS trackingCode,
        o.ordered_at AS placedAt,
        COUNT(oi.id) AS itemsCount
      FROM orders o
      LEFT JOIN order_items oi
        ON oi.order_id = o.id
      WHERE ${conditions.join(' AND ')}
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `,
    params
  );

  return rows.map((row) => ({
    id: row.id,
    orderNumber: row.orderNumber,
    customerName: row.customerName,
    customerEmail: row.customerEmail,
    customerPhone: row.customerPhone,
    status: row.status,
    paymentStatus: row.paymentStatus,
    subtotal: Number(row.subtotal),
    discountAmount: Number(row.discountAmount),
    totalAmount: Number(row.totalAmount),
    trackingCode: row.trackingCode,
    placedAt: row.placedAt,
    itemsCount: Number(row.itemsCount),
  }));
}

async function getAdminOrderByNumber(orderNumber) {
  const rows = await query(
    `
      SELECT o.*
      FROM orders o
      WHERE o.order_number = ?
        AND o.deleted_at IS NULL
      LIMIT 1
    `,
    [orderNumber]
  );

  const order = rows[0];

  if (!order) {
    throw new AppError(404, 'Order not found.');
  }

  const items = await query(
    `
      SELECT
        oi.id,
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

  const address = parseAddressSnapshot(order.address_snapshot);
  const name = splitCustomerName(order.customer_name);

  return {
    id: order.id,
    orderNumber: order.order_number,
    customer: {
      firstName: address.firstName || name.firstName,
      lastName: address.lastName || name.lastName,
      email: order.customer_email,
      phone: order.customer_phone,
      addressLine1: address.addressLine1 || '',
      addressLine2: address.addressLine2 || '',
      city: address.city || '',
      state: address.state || '',
      postalCode: address.postalCode || '',
      addressLabel: address.addressLabel || address.label || '',
      notes: order.notes,
    },
    status: order.order_status,
    paymentStatus: order.payment_status,
    trackingCode: order.tracking_code,
    cancelReason: order.cancel_reason,
    subtotal: Number(order.subtotal_amount),
    discountAmount: Number(order.discount_amount),
    totalAmount: Number(order.total_amount),
    placedAt: order.ordered_at,
    items: items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.productName,
      productSlug: item.productSlug,
      primaryImage: item.primaryImage,
      size: item.size,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      originalPrice: Number(item.originalPrice),
      discountPrice: item.discountPrice !== null ? Number(item.discountPrice) : null,
      lineTotal: Number(item.lineTotal),
    })),
  };
}

async function updateAdminOrderStatus(orderNumber, payload) {
  const rows = await query(
    `
      SELECT
        id,
        order_status AS status,
        customer_email AS customerEmail,
        customer_name AS customerName
      FROM orders
      WHERE order_number = ?
        AND deleted_at IS NULL
      LIMIT 1
    `,
    [orderNumber]
  );

  const order = rows[0];

  if (!order) {
    throw new AppError(404, 'Order not found.');
  }

  if (payload.status === 'cancelled' && !payload.cancelReason) {
    throw new AppError(422, 'Cancel reason is required when cancelling an order.');
  }

  await query(
    `
      UPDATE orders
      SET order_status = ?,
          tracking_code = ?,
          cancel_reason = ?,
          updated_at = NOW()
      WHERE id = ?
    `,
    [
      payload.status,
      payload.trackingCode || null,
      payload.cancelReason || null,
      order.id,
    ]
  );

  try {
    await enqueueEmailJob({
      to: order.customerEmail,
      subject: `Order ${orderNumber} status updated`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Order Status Updated</h2>
          <p>Hello ${splitCustomerName(order.customerName).firstName || order.customerName},</p>
          <p>Your order <strong>${orderNumber}</strong> is now <strong>${payload.status}</strong>.</p>
          ${
            payload.trackingCode
              ? `<p>Tracking Code: <strong>${payload.trackingCode}</strong></p>`
              : ''
          }
          ${
            payload.cancelReason
              ? `<p>Cancel Reason: ${payload.cancelReason}</p>`
              : ''
          }
        </div>
      `,
    });
  } catch (error) {
    console.error('Failed to enqueue order status email:', error.message);
  }

  return {
    orderId: Number(order.id),
    orderNumber,
    status: payload.status,
    trackingCode: payload.trackingCode || null,
    cancelReason: payload.cancelReason || null,
  };
}

async function listAdminNotifyRequests(filters) {
  const conditions = ['nr.deleted_at IS NULL'];
  const params = [];

  if (filters.status) {
    conditions.push('nr.status = ?');
    params.push(filters.status);
  }

  if (filters.search) {
    conditions.push('(nr.requester_email LIKE ? OR nr.requester_phone LIKE ? OR nr.requester_name LIKE ? OR p.name LIKE ?)');
    const term = `%${filters.search}%`;
    params.push(term, term, term, term);
  }

  const rows = await query(
    `
      SELECT
        nr.id,
        nr.requester_name AS fullName,
        nr.requester_email AS email,
        nr.requester_phone AS phone,
        pv.size_code AS size,
        nr.status,
        nr.admin_note AS adminNotes,
        nr.created_at AS createdAt,
        p.id AS productId,
        p.name AS productName,
        p.slug AS productSlug
      FROM notify_requests nr
      INNER JOIN products p
        ON p.id = nr.product_id
      LEFT JOIN product_variants pv
        ON pv.id = nr.product_variant_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY nr.created_at DESC
    `,
    params
  );

  return rows.map((row) => ({
    id: row.id,
    fullName: row.fullName,
    email: row.email,
    phone: row.phone,
    size: row.size,
    status: row.status,
    adminNotes: row.adminNotes,
    createdAt: row.createdAt,
    product: {
      id: row.productId,
      name: row.productName,
      slug: row.productSlug,
    },
  }));
}

async function updateAdminNotifyStatus(notifyRequestId, payload) {
  const rows = await query(
    `
      SELECT id
      FROM notify_requests
      WHERE id = ?
        AND deleted_at IS NULL
      LIMIT 1
    `,
    [notifyRequestId]
  );

  if (!rows[0]) {
    throw new AppError(404, 'Notify request not found.');
  }

  await query(
    `
      UPDATE notify_requests
      SET status = ?,
          admin_note = ?,
          updated_at = NOW()
      WHERE id = ?
    `,
    [payload.status, payload.adminNotes || null, notifyRequestId]
  );

  return {
    notifyRequestId: Number(notifyRequestId),
    status: payload.status,
    adminNotes: payload.adminNotes || null,
  };
}

module.exports = {
  listAdminProducts,
  getAdminProductById,
  createAdminProduct,
  updateAdminProduct,
  softDeleteAdminProduct,
  listAdminOrders,
  getAdminOrderByNumber,
  updateAdminOrderStatus,
  listAdminNotifyRequests,
  updateAdminNotifyStatus,
};
