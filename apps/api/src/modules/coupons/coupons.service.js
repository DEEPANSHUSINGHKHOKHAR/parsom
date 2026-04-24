const { query } = require('../../config/db');
const AppError = require('../../utils/app-error');

async function validateCouponForCheckout(payload) {
  const subtotal = Number(payload.subtotal || 0);
  const code = String(payload.code || '').trim().toUpperCase();

  if (!code) {
    throw new AppError(422, 'Coupon code is required.');
  }

  const rows = await query(
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
    [code]
  );

  const coupon = rows[0];

  if (!coupon) {
    throw new AppError(422, 'Invalid or expired coupon.');
  }

  if (
    coupon.min_order_amount !== null &&
    subtotal < Number(coupon.min_order_amount)
  ) {
    throw new AppError(422, 'Order does not meet coupon minimum amount.');
  }

  if (
    coupon.usage_limit !== null &&
    Number(coupon.used_count) >= Number(coupon.usage_limit)
  ) {
    throw new AppError(422, 'Coupon usage limit reached.');
  }

  let discountAmount = 0;

  if (coupon.discount_type === 'percentage' || coupon.discount_type === 'percent') {
    discountAmount = (subtotal * Number(coupon.discount_value)) / 100;
  } else {
    discountAmount = Number(coupon.discount_value);
  }

  if (
    coupon.max_discount_amount !== null &&
    discountAmount > Number(coupon.max_discount_amount)
  ) {
    discountAmount = Number(coupon.max_discount_amount);
  }

  if (discountAmount > subtotal) {
    discountAmount = subtotal;
  }

  return {
    code: coupon.code,
    discountType: coupon.discount_type,
    discountValue: Number(coupon.discount_value),
    discountAmount,
    totalAfterDiscount: subtotal - discountAmount,
  };
}

module.exports = {
  validateCouponForCheckout,
};
