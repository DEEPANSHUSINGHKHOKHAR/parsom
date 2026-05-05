const { query } = require('../../config/db');
const AppError = require('../../utils/app-error');
const { ensureStoreSchema } = require('../../utils/store-schema');

async function listReviews(filters) {
  await ensureStoreSchema();

  const conditions = ['r.deleted_at IS NULL'];
  const params = [];

  if (filters.search) {
    conditions.push('(r.reviewer_name LIKE ? OR r.reviewer_email LIKE ? OR r.comment LIKE ? OR r.platform LIKE ?)');
    const term = `%${filters.search}%`;
    params.push(term, term, term, term);
  }

  if (filters.isPublished === 'published') {
    conditions.push('r.is_published = 1');
  }

  if (filters.isPublished === 'unpublished') {
    conditions.push('r.is_published = 0');
  }

  const rows = await query(
    `
      SELECT
        r.id,
        r.rating,
        r.comment,
        r.source,
        r.platform,
        r.reviewer_avatar_url AS reviewerAvatarUrl,
        CASE WHEN r.is_published = 1 THEN 1 ELSE 0 END AS isPublished,
        r.created_at AS createdAt,
        r.reviewer_name AS customerName,
        r.reviewer_email AS customerEmail
      FROM website_reviews r
      WHERE ${conditions.join(' AND ')}
      ORDER BY r.updated_at DESC
    `,
    params
  );

  return rows.map((row) => ({
    id: row.id,
    rating: Number(row.rating),
    comment: row.comment,
    source: row.source,
    platform: row.platform,
    reviewerAvatarUrl: row.reviewerAvatarUrl,
    isPublished: Boolean(row.isPublished),
    createdAt: row.createdAt,
    customerName: row.customerName,
    customerEmail: row.customerEmail,
  }));
}

async function createWebsiteReview(payload) {
  await ensureStoreSchema();

  const result = await query(
    `
      INSERT INTO website_reviews (
        user_id,
        reviewer_name,
        reviewer_email,
        reviewer_avatar_url,
        rating,
        comment,
        source,
        platform,
        is_published
      )
      VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      payload.reviewerName,
      payload.reviewerEmail || null,
      payload.reviewerAvatarUrl || null,
      payload.rating,
      payload.comment,
      payload.source || 'outside',
      payload.platform || null,
      payload.isPublished ? 1 : 0,
    ]
  );

  return { reviewId: Number(result.insertId) };
}

async function updateWebsiteReview(reviewId, payload) {
  await ensureStoreSchema();

  const existingRows = await query(
    `
      SELECT id
      FROM website_reviews
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
      UPDATE website_reviews
      SET reviewer_name = ?,
          reviewer_email = ?,
          reviewer_avatar_url = ?,
          rating = ?,
          comment = ?,
          source = ?,
          platform = ?,
          is_published = ?,
          updated_at = NOW()
      WHERE id = ?
    `,
    [
      payload.reviewerName,
      payload.reviewerEmail || null,
      payload.reviewerAvatarUrl || null,
      payload.rating,
      payload.comment,
      payload.source || 'outside',
      payload.platform || null,
      payload.isPublished ? 1 : 0,
      reviewId,
    ]
  );

  return { reviewId: Number(reviewId) };
}

async function updateReviewReply(reviewId, payload) {
  await ensureStoreSchema();

  const existingRows = await query(
    `
      SELECT id
      FROM website_reviews
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
      UPDATE website_reviews
      SET comment = ?,
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
  await ensureStoreSchema();

  const existingRows = await query(
    `
      SELECT id
      FROM website_reviews
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
      UPDATE website_reviews
      SET is_published = ?,
          updated_at = NOW()
      WHERE id = ?
    `,
    [payload.isPublished ? 1 : 0, reviewId]
  );

  return {
    reviewId: Number(reviewId),
    isPublished: Boolean(payload.isPublished),
  };
}

async function deleteReview(reviewId) {
  await ensureStoreSchema();

  const existingRows = await query(
    `
      SELECT id
      FROM website_reviews
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
      UPDATE website_reviews
      SET deleted_at = NOW()
      WHERE id = ?
    `,
    [reviewId]
  );

  return { reviewId: Number(reviewId) };
}

module.exports = {
  listReviews,
  createWebsiteReview,
  updateWebsiteReview,
  updateReviewPublishState,
  updateReviewReply,
  deleteReview,
};
