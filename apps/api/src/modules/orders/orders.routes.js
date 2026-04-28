const express = require('express');
const { body, param } = require('express-validator');

const ordersController = require('./orders.controller');
const validateRequest = require('../../middleware/validate-request.middleware');
const { optionalAuth, requireAuth } = require('../../middleware/auth.middleware');
const { orderLimiter } = require('../../middleware/rate-limit.middleware');

const router = express.Router();

router.post(
  '/',
  optionalAuth,
  orderLimiter,
  [
    body('customer.firstName').trim().notEmpty().isLength({ max: 120 }),
    body('customer.lastName').trim().notEmpty().isLength({ max: 120 }),
    body('customer.email').trim().isEmail().normalizeEmail(),
    body('customer.phone').trim().notEmpty().isLength({ max: 30 }),
    body('customer.addressLine1').trim().notEmpty().isLength({ max: 255 }),
    body('customer.addressLine2').optional({ values: 'falsy' }).trim().isLength({ max: 255 }),
    body('customer.city').trim().notEmpty().isLength({ max: 120 }),
    body('customer.state').trim().notEmpty().isLength({ max: 120 }),
    body('customer.postalCode').trim().notEmpty().isLength({ max: 20 }),
    body('customer.addressLabel').optional({ values: 'falsy' }).trim().isLength({ max: 50 }),
    body('customer.notes').optional({ values: 'falsy' }).trim(),
    body('agreements.termsAccepted').isBoolean(),
    body('agreements.returnPolicyAccepted').isBoolean(),
    body('couponCode').optional({ values: 'falsy' }).trim().isLength({ max: 80 }),
    body('items').isArray({ min: 1 }),
    body('items.*.productId').isInt({ min: 1 }),
    body('items.*.size').trim().notEmpty().isLength({ max: 20 }),
    body('items.*.quantity').isInt({ min: 1, max: 20 })
  ],
  validateRequest,
  ordersController.createOrder
);

router.post(
  '/verify-payment',
  orderLimiter,
  [
    body('orderNumber').trim().matches(/^PSM-[A-Za-z0-9-]{1,80}$/),
    body('razorpayOrderId').trim().notEmpty().isLength({ max: 120 }),
    body('razorpayPaymentId').trim().notEmpty().isLength({ max: 120 }),
    body('razorpaySignature').trim().notEmpty().isLength({ max: 255 }),
  ],
  validateRequest,
  ordersController.verifyOrderPayment
);

router.get('/my', requireAuth, ordersController.getMyOrders);
const orderNumberValidator = [
  param('orderNumber').trim().matches(/^PSM-[A-Za-z0-9-]{1,80}$/),
];

router.get(
  '/my/:orderNumber',
  requireAuth,
  orderNumberValidator,
  validateRequest,
  ordersController.getMyOrderByNumber
);
router.get(
  '/my/:orderNumber/invoice',
  requireAuth,
  orderNumberValidator,
  validateRequest,
  ordersController.getMyOrderInvoice
);
router.get(
  '/my/:orderNumber/invoice.pdf',
  requireAuth,
  orderNumberValidator,
  validateRequest,
  ordersController.getMyOrderInvoicePdf
);

router.get('/returns/my', requireAuth, ordersController.listMyReturnRequests);

router.post(
  '/returns',
  requireAuth,
  [
    body('orderItemId').isInt({ min: 1 }),
    body('reason').trim().notEmpty().isLength({ max: 2000 }),
  ],
  validateRequest,
  ordersController.createReturnRequest
);

module.exports = router;
