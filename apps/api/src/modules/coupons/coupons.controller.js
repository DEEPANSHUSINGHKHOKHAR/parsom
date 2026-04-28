const couponsService = require('./coupons.service');

async function validateCoupon(req, res, next) {
  try {
    const data = await couponsService.validateCouponForCheckout(req.body);

    res.status(200).json({
      success: true,
      message: 'Coupon validated successfully.',
      data,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  validateCoupon,
};