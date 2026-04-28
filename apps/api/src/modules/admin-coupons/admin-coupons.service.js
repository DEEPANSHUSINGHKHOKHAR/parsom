const { query } = require('../../config/db');
const AppError = require('../../utils/app-error');

function toDbDiscountType(value) {
  if (value === 'percent') return 'percentage';
  if (value === 'fixed') return 'flat';
  return value;
}

function toClientDiscountType(value) {
  if (value === 'percentage') return 'percent';
  if (value === 'flat') return 'fixed';
  return value;
}

async function listCoupons() {
  const rows = await query(
    `
      SELECT
        id,
        code,
        discount_type AS discountType,
        discount_value AS discountValue,
        min_order_amount AS minimumOrderAmount,
        max_discount_amount AS maximumDiscountAmount,
        usage_limit AS usageLimit,
        usage_per_user AS perUserLimit,
        used_count AS totalUsed,
        starts_at AS startsAt,
        ends_at AS endsAt,
        is_active AS isActive,
        created_at AS createdAt,
        (
          SELECT COUNT(*)
          FROM orders o
          WHERE o.coupon_id = coupons.id
            AND o.deleted_at IS NULL
        ) AS orderUsageCount,
        (
          SELECT COALESCE(SUM(o.discount_amount), 0)
          FROM orders o
          WHERE o.coupon_id = coupons.id
            AND o.deleted_at IS NULL
            AND o.order_status <> 'cancelled'
        ) AS totalDiscountGiven
      FROM coupons
      WHERE deleted_at IS NULL
      ORDER BY created_at DESC
    `
  );

  return rows.map((row) => ({
    ...row,
    discountType: toClientDiscountType(row.discountType),
    discountValue: Number(row.discountValue),
    minimumOrderAmount:
      row.minimumOrderAmount !== null ? Number(row.minimumOrderAmount) : null,
    maximumDiscountAmount:
      row.maximumDiscountAmount !== null
        ? Number(row.maximumDiscountAmount)
        : null,
    usageLimit: row.usageLimit !== null ? Number(row.usageLimit) : null,
    perUserLimit: row.perUserLimit !== null ? Number(row.perUserLimit) : null,
    totalUsed: Number(row.totalUsed),
    orderUsageCount: Number(row.orderUsageCount || 0),
    totalDiscountGiven: Number(row.totalDiscountGiven || 0),
    isActive: Boolean(row.isActive),
  }));
}

async function listDeletedCoupons() {
  const rows = await query(
    `
      SELECT
        c.id,
        c.code,
        c.discount_type AS discountType,
        c.discount_value AS discountValue,
        c.usage_limit AS usageLimit,
        c.usage_per_user AS perUserLimit,
        c.used_count AS totalUsed,
        c.deleted_at AS deletedAt,
        COUNT(o.id) AS orderUsageCount,
        COALESCE(SUM(CASE WHEN o.order_status <> 'cancelled' THEN o.discount_amount ELSE 0 END), 0) AS totalDiscountGiven
      FROM coupons c
      LEFT JOIN orders o
        ON o.coupon_id = c.id
        AND o.deleted_at IS NULL
      WHERE c.deleted_at IS NOT NULL
      GROUP BY c.id
      ORDER BY c.deleted_at DESC
    `
  );

  return rows.map((row) => ({
    id: row.id,
    code: row.code,
    discountType: toClientDiscountType(row.discountType),
    discountValue: Number(row.discountValue),
    usageLimit: row.usageLimit !== null ? Number(row.usageLimit) : null,
    perUserLimit: row.perUserLimit !== null ? Number(row.perUserLimit) : null,
    totalUsed: Number(row.totalUsed || 0),
    orderUsageCount: Number(row.orderUsageCount || 0),
    totalDiscountGiven: Number(row.totalDiscountGiven || 0),
    deletedAt: row.deletedAt,
  }));
}

async function createCoupon(payload) {
  const code = payload.code.toUpperCase();

  const existing = await query(
    `
      SELECT id
      FROM coupons
      WHERE deleted_at IS NULL
        AND code = ?
      LIMIT 1
    `,
    [code]
  );

  if (existing[0]) {
    throw new AppError(409, 'Coupon code already exists.');
  }

  const result = await query(
    `
      INSERT INTO coupons (
        code,
        discount_type,
        discount_value,
        title,
        min_order_amount,
        max_discount_amount,
        usage_limit,
        usage_per_user,
        starts_at,
        ends_at,
        is_active
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      code,
      toDbDiscountType(payload.discountType),
      payload.discountValue,
      payload.title || code,
      payload.minimumOrderAmount ?? null,
      payload.maximumDiscountAmount ?? null,
      payload.usageLimit ?? null,
      payload.perUserLimit ?? null,
      payload.startsAt ?? null,
      payload.endsAt ?? null,
      payload.isActive === false ? 0 : 1,
    ]
  );

  return { couponId: result.insertId };
}

async function updateCoupon(couponId, payload) {
  const existingRows = await query(
    `
      SELECT *
      FROM coupons
      WHERE id = ?
        AND deleted_at IS NULL
      LIMIT 1
    `,
    [couponId]
  );

  const existing = existingRows[0];

  if (!existing) {
    throw new AppError(404, 'Coupon not found.');
  }

  const nextCode = payload.code ? payload.code.toUpperCase() : existing.code;

  if (nextCode !== existing.code) {
    const duplicate = await query(
      `
        SELECT id
        FROM coupons
        WHERE deleted_at IS NULL
          AND id <> ?
          AND code = ?
        LIMIT 1
      `,
      [couponId, nextCode]
    );

    if (duplicate[0]) {
      throw new AppError(409, 'Coupon code already exists.');
    }
  }

  await query(
    `
      UPDATE coupons
      SET code = ?,
          discount_type = ?,
          discount_value = ?,
          title = ?,
          min_order_amount = ?,
          max_discount_amount = ?,
          usage_limit = ?,
          usage_per_user = ?,
          starts_at = ?,
          ends_at = ?,
          is_active = ?,
          updated_at = NOW()
      WHERE id = ?
    `,
    [
      nextCode,
      toDbDiscountType(payload.discountType ?? existing.discount_type),
      payload.discountValue !== undefined
        ? payload.discountValue
        : existing.discount_value,
      payload.title ?? existing.title,
      payload.minimumOrderAmount !== undefined
        ? payload.minimumOrderAmount
        : existing.min_order_amount,
      payload.maximumDiscountAmount !== undefined
        ? payload.maximumDiscountAmount
        : existing.max_discount_amount,
      payload.usageLimit !== undefined ? payload.usageLimit : existing.usage_limit,
      payload.perUserLimit !== undefined
        ? payload.perUserLimit
        : existing.usage_per_user,
      payload.startsAt !== undefined ? payload.startsAt : existing.starts_at,
      payload.endsAt !== undefined ? payload.endsAt : existing.ends_at,
      payload.isActive !== undefined ? (payload.isActive ? 1 : 0) : existing.is_active,
      couponId,
    ]
  );

  return { couponId: Number(couponId) };
}

async function deleteCoupon(couponId) {
  const existingRows = await query(
    `
      SELECT id
      FROM coupons
      WHERE id = ?
        AND deleted_at IS NULL
      LIMIT 1
    `,
    [couponId]
  );

  if (!existingRows[0]) {
    throw new AppError(404, 'Coupon not found.');
  }

  await query(
    `
      UPDATE coupons
      SET deleted_at = NOW(),
          is_active = 0
      WHERE id = ?
    `,
    [couponId]
  );

  return { couponId: Number(couponId) };
}

async function restoreCoupon(couponId) {
  const existingRows = await query(
    `
      SELECT id
      FROM coupons
      WHERE id = ?
        AND deleted_at IS NOT NULL
      LIMIT 1
    `,
    [couponId]
  );

  if (!existingRows[0]) {
    throw new AppError(404, 'Deleted coupon not found.');
  }

  await query(
    `
      UPDATE coupons
      SET deleted_at = NULL,
          is_active = 1,
          updated_at = NOW()
      WHERE id = ?
    `,
    [couponId]
  );

  return { couponId: Number(couponId) };
}

async function permanentlyDeleteCoupon(couponId) {
  const usageRows = await query(
    `
      SELECT COUNT(*) AS total
      FROM orders
      WHERE coupon_id = ?
        AND deleted_at IS NULL
    `,
    [couponId]
  );

  if (Number(usageRows[0].total) > 0) {
    throw new AppError(409, 'Coupon is linked to order history and cannot be permanently deleted.');
  }

  const existingRows = await query(
    `
      SELECT id
      FROM coupons
      WHERE id = ?
        AND deleted_at IS NOT NULL
      LIMIT 1
    `,
    [couponId]
  );

  if (!existingRows[0]) {
    throw new AppError(404, 'Deleted coupon not found.');
  }

  await query('DELETE FROM coupons WHERE id = ?', [couponId]);

  return { couponId: Number(couponId) };
}

module.exports = {
  listCoupons,
  listDeletedCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  restoreCoupon,
  permanentlyDeleteCoupon,
};
