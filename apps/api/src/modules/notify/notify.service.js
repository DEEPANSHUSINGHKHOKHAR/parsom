const { query } = require('../../config/db');
const AppError = require('../../utils/app-error');
const { enqueueNotifySheetJob } = require('../../jobs/notification.jobs');
const { ensureStoreSchema } = require('../../utils/store-schema');

async function createNotifyRequest(payload, actor) {
  await ensureStoreSchema();

  const { productId, requestedSize, fullName, email, phone } = payload;

  const productRows = await query(
    `
      SELECT
        p.id,
        p.name,
        p.slug,
        p.sku_prefix AS skuPrefix,
        pv.id AS variantId,
        pv.size_code AS size,
        pv.notify_only AS notifyOnly,
        GREATEST(COALESCE(ss.stock_qty, 0) - COALESCE(ss.reserved_qty, 0), 0) AS availableStock
      FROM products p
      LEFT JOIN product_variants pv
        ON pv.product_id = p.id
        AND pv.deleted_at IS NULL
        AND pv.is_active = 1
        AND pv.size_code = ?
      LEFT JOIN size_stock ss
        ON ss.product_variant_id = pv.id
      WHERE p.id = ?
        AND p.deleted_at IS NULL
        AND p.is_active = 1
      LIMIT 1
    `,
    [requestedSize, productId]
  );

  const product = productRows[0];

  if (!product) {
    throw new AppError(404, 'Product not found.');
  }

  let variantId = product.variantId;

  if (!variantId || !product.notifyOnly || Number(product.availableStock) > 0) {
    throw new AppError(422, 'Notify is only available for admin-enabled notify sizes.');
  }

  const duplicateRows = await query(
    `
      SELECT id
      FROM notify_requests
      WHERE deleted_at IS NULL
        AND product_id = ?
        AND product_variant_id = ?
        AND (
          (user_id IS NOT NULL AND user_id = ?)
          OR
          (requester_email = ? AND requester_phone = ?)
        )
        AND status IN ('pending', 'read', 'stock_updated', 'contacted')
      LIMIT 1
    `,
    [productId, variantId, actor?.id || null, email, phone]
  );

  if (duplicateRows.length > 0) {
    throw new AppError(409, 'A notify request already exists for this product and size.');
  }

  const insertResult = await query(
    `
      INSERT INTO notify_requests (
        user_id,
        product_id,
        product_variant_id,
        requester_name,
        requester_email,
        requester_phone,
        status
      )
      VALUES (?, ?, ?, ?, ?, ?, 'pending')
    `,
    [
      actor?.role === 'user' ? actor.id : null,
      productId,
      variantId,
      fullName,
      email,
      phone,
    ]
  );

  try {
    await enqueueNotifySheetJob({
      id: insertResult.insertId,
      productId,
      productName: product.name,
      size: requestedSize,
      fullName,
      email,
      phone,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to enqueue notify sheets job:', error.message);
  }

  return {
    requestId: insertResult.insertId,
    productId,
    requestedSize,
    status: 'pending',
  };
}

async function getMyNotifyRequests(actor) {
  const rows = await query(
    `
      SELECT
        nr.id,
        pv.size_code AS size,
        nr.status,
        nr.requester_name AS fullName,
        nr.requester_email AS email,
        nr.requester_phone AS phone,
        nr.created_at AS createdAt,
        p.id AS productId,
        p.name AS productName,
        p.slug AS productSlug,
        (
          SELECT pi.file_url
          FROM product_images pi
          WHERE pi.product_id = p.id
            AND pi.deleted_at IS NULL
            AND pi.is_primary = 1
          ORDER BY pi.sort_order ASC, pi.id ASC
          LIMIT 1
        ) AS primaryImage
      FROM notify_requests nr
      INNER JOIN products p
        ON p.id = nr.product_id
      LEFT JOIN product_variants pv
        ON pv.id = nr.product_variant_id
      WHERE nr.user_id = ?
        AND nr.deleted_at IS NULL
      ORDER BY nr.created_at DESC
    `,
    [actor.id]
  );

  return rows.map((row) => ({
    id: row.id,
    size: row.size,
    status: row.status,
    fullName: row.fullName,
    email: row.email,
    phone: row.phone,
    createdAt: row.createdAt,
    product: {
      id: row.productId,
      name: row.productName,
      slug: row.productSlug,
      primaryImage: row.primaryImage,
    },
  }));
}

module.exports = {
  createNotifyRequest,
  getMyNotifyRequests,
};
