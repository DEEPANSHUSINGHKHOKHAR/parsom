const express = require('express');
const { body, param } = require('express-validator');

const controller = require('./wishlist.controller');
const validateRequest = require('../../middleware/validate-request.middleware');
const { requireAuth } = require('../../middleware/auth.middleware');

const router = express.Router();

router.use(requireAuth);

router.get('/', controller.getMyWishlist);

router.post(
  '/',
  [body('productId').isInt({ min: 1 })],
  validateRequest,
  controller.addWishlistItem
);

router.delete(
  '/:productId',
  [param('productId').isInt({ min: 1 })],
  validateRequest,
  controller.removeWishlistItem
);

module.exports = router;