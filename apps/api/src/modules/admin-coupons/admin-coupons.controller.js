const couponsService = require('./admin-coupons.service');
const { writeAuditLog } = require('../../utils/audit-log');

async function listCoupons(req, res, next) {
  try {
    const data = await couponsService.listCoupons();
    res.status(200).json({
      success: true,
      message: 'Coupons fetched successfully.',
      data,
    });
  } catch (error) {
    next(error);
  }
}

async function createCoupon(req, res, next) {
  try {
    const data = await couponsService.createCoupon(req.body);
    await writeAuditLog({
      actorType: 'admin',
      actorId: req.user.id,
      actionKey: 'coupons.create',
      resourceType: 'coupon',
      resourceId: data.couponId,
      req,
      meta: {
        code: req.body.code,
        discountType: req.body.discountType,
      },
    });
    res.status(201).json({
      success: true,
      message: 'Coupon created successfully.',
      data,
    });
  } catch (error) {
    next(error);
  }
}

async function updateCoupon(req, res, next) {
  try {
    const data = await couponsService.updateCoupon(req.params.couponId, req.body);
    await writeAuditLog({
      actorType: 'admin',
      actorId: req.user.id,
      actionKey: 'coupons.update',
      resourceType: 'coupon',
      resourceId: data.couponId,
      req,
      meta: req.body,
    });
    res.status(200).json({
      success: true,
      message: 'Coupon updated successfully.',
      data,
    });
  } catch (error) {
    next(error);
  }
}

async function deleteCoupon(req, res, next) {
  try {
    const data = await couponsService.deleteCoupon(req.params.couponId);
    await writeAuditLog({
      actorType: 'admin',
      actorId: req.user.id,
      actionKey: 'coupons.delete',
      resourceType: 'coupon',
      resourceId: data.couponId,
      req,
    });
    res.status(200).json({
      success: true,
      message: 'Coupon deleted successfully.',
      data,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
};
