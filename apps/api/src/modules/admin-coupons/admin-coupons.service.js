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
        created_at AS createdAt
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
    isActive: Boolean(row.isActive),
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

module.exports = {
  listCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
};
