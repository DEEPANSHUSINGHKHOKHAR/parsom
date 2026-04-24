const express = require('express');
const { body } = require('express-validator');

const controller = require('./coupons.controller');
const validateRequest = require('../../middleware/validate-request.middleware');

const router = express.Router();

router.post(
  '/validate',
  [
    body('code').trim().notEmpty().isLength({ max: 80 }),
    body('subtotal').isFloat({ min: 0 }),
  ],
  validateRequest,
  controller.validateCoupon
);

module.exports = router;