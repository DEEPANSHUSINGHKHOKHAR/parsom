const { query } = require('../../config/db');
const AppError = require('../../utils/app-error');
const { ensureStoreSchema } = require('../../utils/store-schema');

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
  await ensureStoreSchema();

  const rating = Number(payload.rating);
  const comment = String(payload.comment || '').trim();
  const userRows = await query(
    `
      SELECT first_name AS firstName, last_name AS lastName, email
      FROM users
      WHERE id = ?
      LIMIT 1
    `,
    [actor.id]
  );
  const user = userRows[0] || {};
  const reviewerName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || 'Customer';

  const existingRows = await query(
    `
      SELECT id
      FROM website_reviews
      WHERE user_id = ?
        AND deleted_at IS NULL
      LIMIT 1
    `,
    [actor.id]
  );

  if (existingRows[0]) {
    await query(
      `
        UPDATE website_reviews
        SET reviewer_name = ?,
            reviewer_email = ?,
            reviewer_avatar_url = NULL,
            rating = ?,
            comment = ?,
            source = 'customer',
            platform = 'Website',
            is_published = 1,
            updated_at = NOW()
        WHERE id = ?
      `,
      [reviewerName, user.email || actor.email || null, rating, comment, existingRows[0].id]
    );

    return {
      reviewId: Number(existingRows[0].id),
      rating,
      comment,
      isPublished: true,
    };
  }

  const insertResult = await query(
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
      VALUES (?, ?, ?, NULL, ?, ?, 'customer', 'Website', 1)
    `,
    [actor.id, reviewerName, user.email || actor.email || null, rating, comment]
  );

  return {
    reviewId: insertResult.insertId,
    rating,
    comment,
    isPublished: true,
  };
}

async function getMyReviews(actor) {
  await ensureStoreSchema();

  const rows = await query(
    `
      SELECT
        id,
        rating,
        comment,
        is_published AS isPublished,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM website_reviews
      WHERE user_id = ?
        AND deleted_at IS NULL
      ORDER BY updated_at DESC
    `,
    [actor.id]
  );

  return rows.map((row) => ({
    id: row.id,
    rating: Number(row.rating),
    comment: row.comment,
    isPublished: Boolean(row.isPublished),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));
}

async function getEligibleReviewItems(actor) {
  await ensureStoreSchema();

  return [];
}

async function updateMyReview(reviewId, payload, actor) {
  await ensureStoreSchema();

  const existingRows = await query(
    `
      SELECT id
      FROM website_reviews
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
      UPDATE website_reviews
      SET rating = ?,
          comment = ?,
          is_published = 1,
          updated_at = NOW()
      WHERE id = ?
    `,
    [payload.rating, payload.comment, reviewId]
  );

  return {
    reviewId,
    rating: payload.rating,
    comment: payload.comment,
    isPublished: true,
  };
}

async function deleteMyReview(reviewId, actor) {
  await ensureStoreSchema();

  const existingRows = await query(
    `
      SELECT id
      FROM website_reviews
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
      UPDATE website_reviews
      SET deleted_at = NOW()
      WHERE id = ?
    `,
    [reviewId]
  );

  return { reviewId };
}

async function getPublishedWebsiteReviews() {
  await ensureStoreSchema();

  const rows = await query(
    `
      SELECT
        reviewer_name AS reviewerName,
        reviewer_avatar_url AS reviewerAvatarUrl,
        rating,
        comment,
        source,
        platform,
        created_at AS createdAt
      FROM website_reviews
      WHERE deleted_at IS NULL
        AND is_published = 1
      ORDER BY updated_at DESC
      LIMIT 9
    `
  );

  const summaryRows = await query(
    `
      SELECT
        COALESCE(AVG(rating), 0) AS averageRating,
        COUNT(*) AS reviewCount
      FROM website_reviews
      WHERE deleted_at IS NULL
        AND is_published = 1
    `
  );

  return {
    averageRating: Number(summaryRows[0]?.averageRating || 0),
    reviewCount: Number(summaryRows[0]?.reviewCount || 0),
    items: rows.map((row) => ({
      reviewerName: row.reviewerName,
      reviewerAvatarUrl: row.reviewerAvatarUrl,
      rating: Number(row.rating),
      comment: row.comment,
      source: row.source,
      platform: row.platform,
      createdAt: row.createdAt,
    })),
  };
}

module.exports = {
  createReview,
  getMyReviews,
  getEligibleReviewItems,
  updateMyReview,
  deleteMyReview,
  getPublishedWebsiteReviews,
};
