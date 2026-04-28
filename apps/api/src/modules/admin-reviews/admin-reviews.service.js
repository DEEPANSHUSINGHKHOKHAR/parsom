const { query } = require('../../config/db');
const AppError = require('../../utils/app-error');

async function listReviews(filters) {
  const conditions = ['r.deleted_at IS NULL'];
  const params = [];

  if (filters.search) {
    conditions.push('(p.name LIKE ? OR u.email LIKE ? OR CONCAT(u.first_name, " ", u.last_name) LIKE ?)');
    const term = `%${filters.search}%`;
    params.push(term, term, term);
  }

  if (filters.isPublished === 'published') {
    conditions.push("r.review_status = 'approved'");
  }

  if (filters.isPublished === 'unpublished') {
    conditions.push("r.review_status <> 'approved'");
  }

  const rows = await query(
    `
      SELECT
        r.id,
        r.rating,
        r.comment,
        r.image_path AS imageUrl,
        r.admin_reply AS adminReply,
        CASE WHEN r.review_status = 'approved' THEN 1 ELSE 0 END AS isPublished,
        r.created_at AS createdAt,
        p.id AS productId,
        p.name AS productName,
        p.slug AS productSlug,
        CONCAT(u.first_name, ' ', u.last_name) AS customerName,
        u.email AS customerEmail
      FROM reviews r
      INNER JOIN products p
        ON p.id = r.product_id
      INNER JOIN users u
        ON u.id = r.user_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY r.created_at DESC
    `,
    params
  );

  return rows.map((row) => ({
    id: row.id,
    rating: Number(row.rating),
    comment: row.comment,
    imageUrl: row.imageUrl,
    adminReply: row.adminReply || '',
    isPublished: Boolean(row.isPublished),
    createdAt: row.createdAt,
    product: {
      id: row.productId,
      name: row.productName,
      slug: row.productSlug,
    },
    customerName: row.customerName,
    customerEmail: row.customerEmail,
  }));
}

async function updateReviewReply(reviewId, payload) {
  const existingRows = await query(
    `
      SELECT id
      FROM reviews
      WHERE id = ?
        AND deleted_at IS NULL
      LIMIT 1
    `,
    [reviewId]
  );

  if (!existingRows[0]) {
    throw new AppError(404, 'Review not found.');
  }

  await query(
    `
      UPDATE reviews
      SET admin_reply = ?,
          updated_at = NOW()
      WHERE id = ?
    `,
    [payload.adminReply || null, reviewId]
  );

  return {
    reviewId: Number(reviewId),
    adminReply: payload.adminReply || '',
  };
}

async function updateReviewPublishState(reviewId, payload) {
  const existingRows = await query(
    `
      SELECT id
      FROM reviews
      WHERE id = ?
        AND deleted_at IS NULL
      LIMIT 1
    `,
    [reviewId]
  );

  if (!existingRows[0]) {
    throw new AppError(404, 'Review not found.');
  }

  await query(
    `
      UPDATE reviews
      SET review_status = ?,
          updated_at = NOW()
      WHERE id = ?
    `,
    [payload.isPublished ? 'approved' : 'hidden', reviewId]
  );

  return {
    reviewId: Number(reviewId),
    isPublished: Boolean(payload.isPublished),
  };
}

async function deleteReview(reviewId) {
  const existingRows = await query(
    `
      SELECT id
      FROM reviews
      WHERE id = ?
        AND deleted_at IS NULL
      LIMIT 1
    `,
    [reviewId]
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

  return { reviewId: Number(reviewId) };
}

module.exports = {
  listReviews,
  updateReviewPublishState,
  updateReviewReply,
  deleteReview,
};
