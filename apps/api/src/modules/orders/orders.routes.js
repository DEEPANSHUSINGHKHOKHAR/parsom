const express = require('express');
const { body } = require('express-validator');

const ordersController = require('./orders.controller');
const validateRequest = require('../../middleware/validate-request.middleware');
const { optionalAuth, requireAuth } = require('../../middleware/auth.middleware');

const router = express.Router();

router.post(
  '/',
  optionalAuth,
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
    body('couponCode').optional({ values: 'falsy' }).trim().isLength({ max: 80 }),
    body('items').isArray({ min: 1 }),
    body('items.*.productId').isInt({ min: 1 }),
    body('items.*.size').trim().notEmpty().isLength({ max: 20 }),
    body('items.*.quantity').isInt({ min: 1, max: 20 })
  ],
  validateRequest,
  ordersController.createOrder
);

router.get('/my', requireAuth, ordersController.getMyOrders);
router.get('/my/:orderNumber', requireAuth, ordersController.getMyOrderByNumber);
router.get('/my/:orderNumber/invoice', requireAuth, ordersController.getMyOrderInvoice);
router.get('/my/:orderNumber/invoice.pdf', requireAuth, ordersController.getMyOrderInvoicePdf);

module.exports = router;
