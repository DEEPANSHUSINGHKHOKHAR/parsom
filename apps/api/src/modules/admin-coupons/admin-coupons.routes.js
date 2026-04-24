const express = require('express');
const { body, param } = require('express-validator');

const controller = require('./admin-coupons.controller');
const validateRequest = require('../../middleware/validate-request.middleware');
const { requireAuth } = require('../../middleware/auth.middleware');
const { requirePermission } = require('../../middleware/admin-permission.middleware');

const router = express.Router();

router.use(requireAuth);

router.get('/', requirePermission('coupons.read'), controller.listCoupons);

router.post(
  '/',
  requirePermission('coupons.write'),
  [
    body('code').trim().notEmpty().isLength({ max: 80 }),
    body('discountType').isIn(['percent', 'fixed']),
    body('discountValue').isFloat({ min: 0 }),
    body('minimumOrderAmount').optional({ values: 'falsy' }).isFloat({ min: 0 }),
    body('maximumDiscountAmount').optional({ values: 'falsy' }).isFloat({ min: 0 }),
    body('usageLimit').optional({ values: 'falsy' }).isInt({ min: 0 }),
    body('perUserLimit').optional({ values: 'falsy' }).isInt({ min: 0 }),
    body('startsAt').optional({ values: 'falsy' }).isISO8601(),
    body('endsAt').optional({ values: 'falsy' }).isISO8601(),
    body('isActive').optional().isBoolean(),
  ],
  validateRequest,
  controller.createCoupon
);

router.patch(
  '/:couponId',
  requirePermission('coupons.write'),
  [
    param('couponId').isInt({ min: 1 }),
    body('code').optional().trim().notEmpty().isLength({ max: 80 }),
    body('discountType').optional().isIn(['percent', 'fixed']),
    body('discountValue').optional().isFloat({ min: 0 }),
    body('minimumOrderAmount').optional({ values: 'falsy' }).isFloat({ min: 0 }),
    body('maximumDiscountAmount').optional({ values: 'falsy' }).isFloat({ min: 0 }),
    body('usageLimit').optional({ values: 'falsy' }).isInt({ min: 0 }),
    body('perUserLimit').optional({ values: 'falsy' }).isInt({ min: 0 }),
    body('startsAt').optional({ values: 'falsy' }).isISO8601(),
    body('endsAt').optional({ values: 'falsy' }).isISO8601(),
    body('isActive').optional().isBoolean(),
  ],
  validateRequest,
  controller.updateCoupon
);

router.delete(
  '/:couponId',
  requirePermission('coupons.write'),
  [param('couponId').isInt({ min: 1 })],
  validateRequest,
  controller.deleteCoupon
);

module.exports = router;
