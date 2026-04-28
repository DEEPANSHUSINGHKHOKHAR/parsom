const express = require('express');
const { body, param } = require('express-validator');

const addressesController = require('./addresses.controller');
const validateRequest = require('../../middleware/validate-request.middleware');
const { requireAuth } = require('../../middleware/auth.middleware');

const router = express.Router();

router.get('/', requireAuth, addressesController.getMyAddresses);

router.post(
  '/',
  requireAuth,
  [
    body('fullName').trim().notEmpty().isLength({ max: 160 }),
    body('phone').trim().notEmpty().isLength({ max: 30 }),
    body('addressLine1').trim().notEmpty().isLength({ max: 255 }),
    body('addressLine2').optional({ values: 'falsy' }).trim().isLength({ max: 255 }),
    body('city').trim().notEmpty().isLength({ max: 120 }),
    body('state').trim().notEmpty().isLength({ max: 120 }),
    body('postalCode').trim().notEmpty().isLength({ max: 20 }),
    body('label').optional({ values: 'falsy' }).trim().isLength({ max: 50 }),
    body('isDefault').optional().isBoolean(),
  ],
  validateRequest,
  addressesController.createAddress
);

router.patch(
  '/:addressId',
  requireAuth,
  [
    param('addressId').isInt({ min: 1 }),
    body('fullName').optional().trim().notEmpty().isLength({ max: 160 }),
    body('phone').optional().trim().notEmpty().isLength({ max: 30 }),
    body('addressLine1').optional().trim().notEmpty().isLength({ max: 255 }),
    body('addressLine2').optional({ values: 'falsy' }).trim().isLength({ max: 255 }),
    body('city').optional().trim().notEmpty().isLength({ max: 120 }),
    body('state').optional().trim().notEmpty().isLength({ max: 120 }),
    body('postalCode').optional().trim().notEmpty().isLength({ max: 20 }),
    body('label').optional({ values: 'falsy' }).trim().isLength({ max: 50 }),
    body('isDefault').optional().isBoolean(),
  ],
  validateRequest,
  addressesController.updateAddress
);

router.patch(
  '/:addressId/default',
  requireAuth,
  [param('addressId').isInt({ min: 1 })],
  validateRequest,
  addressesController.setDefaultAddress
);

router.delete(
  '/:addressId',
  requireAuth,
  [param('addressId').isInt({ min: 1 })],
  validateRequest,
  addressesController.deleteAddress
);

module.exports = router;