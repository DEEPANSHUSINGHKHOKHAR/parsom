const { query } = require('../../config/db');
const AppError = require('../../utils/app-error');

function normalizeReviewMedia(payload = {}) {
  const media = Array.isArray(payload.media)
    ? payload.media
        .filter((item) => item?.url)
        .slice(0, 6)
        .map((item) => ({
          type: item.type === 'video' ? 'video' : 'image',
          url: item.url,
        }))
    : [];

  if (media.length > 0) return media;
  if (payload.imageUrl) return [{ type: 'image', url: payload.imageUrl }];

  return [];
}

function serializeReviewMedia(payload = {}) {
  const media = normalizeReviewMedia(payload);
  if (media.length === 0) return null;
  if (media.length === 1 && !Array.isArray(payload.media)) return media[0].url;

  return JSON.stringify(media);
}

function parseReviewMedia(value) {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed
        .filter((item) => item?.url)
        .map((item) => ({
          type: item.type === 'video' ? 'video' : 'image',
          url: item.url,
        }));
    }
  } catch {
    return [{ type: 'image', url: value }];
  }

  return [{ type: 'image', url: value }];
}

async function createReview(payload, actor) {
  const { productId, orderItemId, rating, comment } = payload;
  const reviewMedia = normalizeReviewMedia(payload);

  const reviewExists = await query(
    `
      SELECT id
      FROM reviews
      WHERE user_id = ?
        AND order_item_id = ?
        AND deleted_at IS NULL
      LIMIT 1
    `,
    [actor.id, orderItemId]
  );

  if (reviewExists.length > 0) {
    throw new AppError(409, 'A review already exists for this purchased item.');
  }

  const eligibleRows = await query(
    `
      SELECT
        oi.id,
        oi.product_id,
        o.id AS orderId
      FROM order_items oi
      INNER JOIN orders o
        ON o.id = oi.order_id
      WHERE oi.id = ?
        AND oi.product_id = ?
        AND o.user_id = ?
        AND o.deleted_at IS NULL
        AND o.order_status = 'delivered'
      LIMIT 1
    `,
    [orderItemId, productId, actor.id]
  );

  if (!eligibleRows[0]) {
    throw new AppError(
      422,
      'Review can only be submitted for your delivered purchased item.'
    );
  }

  const insertResult = await query(
    `
      INSERT INTO reviews (
        user_id,
        order_id,
        product_id,
        order_item_id,
        rating,
        comment,
        image_path,
        review_status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, 'approved')
    `,
    [
      actor.id,
      eligibleRows[0].orderId,
      productId,
      orderItemId,
      rating,
      comment,
      serializeReviewMedia(payload),
    ]
  );

  return {
    reviewId: insertResult.insertId,
    productId,
    orderItemId,
    rating,
    comment,
    imageUrl: reviewMedia[0]?.url || null,
    media: reviewMedia,
  };
}

async function getMyReviews(actor) {
  const rows = await query(
    `
      SELECT
        r.id,
        r.rating,
        r.comment,
        r.image_path AS imageUrl,
        CASE WHEN r.review_status = 'approved' THEN 1 ELSE 0 END AS isPublished,
        r.created_at AS createdAt,
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
      FROM reviews r
      INNER JOIN products p
        ON p.id = r.product_id
      WHERE r.user_id = ?
        AND r.deleted_at IS NULL
      ORDER BY r.created_at DESC
    `,
    [actor.id]
  );

  return rows.map((row) => ({
    id: row.id,
    rating: Number(row.rating),
    comment: row.comment,
    imageUrl: parseReviewMedia(row.imageUrl)[0]?.url || null,
    media: parseReviewMedia(row.imageUrl),
    isPublished: Boolean(row.isPublished),
    createdAt: row.createdAt,
    product: {
      id: row.productId,
      name: row.productName,
      slug: row.productSlug,
      primaryImage: row.primaryImage,
    },
  }));
}

async function getEligibleReviewItems(actor) {
  const rows = await query(
    `
      SELECT
        oi.id AS orderItemId,
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
        o.order_number AS orderNumber
      FROM order_items oi
      INNER JOIN orders o
        ON o.id = oi.order_id
      LEFT JOIN reviews r
        ON r.order_item_id = oi.id
        AND r.user_id = o.user_id
        AND r.deleted_at IS NULL
      WHERE o.user_id = ?
        AND o.order_status = 'delivered'
        AND o.deleted_at IS NULL
        AND r.id IS NULL
      ORDER BY o.created_at DESC, oi.id DESC
    `,
    [actor.id]
  );

  return rows.map((row) => ({
    orderItemId: row.orderItemId,
    productId: row.productId,
    productName: row.productName,
    productSlug: row.productSlug,
    primaryImage: row.primaryImage,
    size: row.size,
    orderNumber: row.orderNumber,
  }));
}

async function updateMyReview(reviewId, payload, actor) {
  const existingRows = await query(
    `
      SELECT id
      FROM reviews
      WHERE id = ?
        AND user_id = ?
        AND deleted_at IS NULL
      LIMIT 1
    `,
    [reviewId, actor.id]
  );

  if (!existingRows[0]) {
    throw new AppError(404, 'Review not found.');
  }

  await query(
    `
      UPDATE reviews
      SET rating = ?,
          comment = ?,
          image_path = ?,
          updated_at = NOW()
      WHERE id = ?
    `,
    [payload.rating, payload.comment, serializeReviewMedia(payload), reviewId]
  );

  const reviewMedia = normalizeReviewMedia(payload);

  return {
    reviewId,
    rating: payload.rating,
    comment: payload.comment,
    imageUrl: reviewMedia[0]?.url || null,
    media: reviewMedia,
  };
}

async function deleteMyReview(reviewId, actor) {
  const existingRows = await query(
    `
      SELECT id
      FROM reviews
      WHERE id = ?
        AND user_id = ?
        AND deleted_at IS NULL
      LIMIT 1
    `,
    [reviewId, actor.id]
  );

  if (!existingRows[0]) {
    throw new AppError(404, 'Review not found.');
  }

  await query(
    `
      UPDATE reviews
      SET deleted_at = NOW()
      WHERE id = ?
    `,
    [reviewId]
  );

  return { reviewId };
}

module.exports = {
  createReview,
  getMyReviews,
  getEligibleReviewItems,
  updateMyReview,
  deleteMyReview,
};
