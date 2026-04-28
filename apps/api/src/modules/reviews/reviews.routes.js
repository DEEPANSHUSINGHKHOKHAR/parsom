const express = require('express');
const { body, param } = require('express-validator');

const reviewsController = require('./reviews.controller');
const validateRequest = require('../../middleware/validate-request.middleware');
const { requireAuth } = require('../../middleware/auth.middleware');
const { reviewLimiter } = require('../../middleware/rate-limit.middleware');

const router = express.Router();

router.post(
  '/',
  requireAuth,
  reviewLimiter,
  [
    body('productId').isInt({ min: 1 }),
    body('orderItemId').isInt({ min: 1 }),
    body('rating').isInt({ min: 1, max: 5 }),
    body('comment').trim().notEmpty(),
    body('imageUrl').optional({ values: 'falsy' }).trim().isLength({ max: 500 }),
    body('media').optional().isArray({ max: 6 }),
    body('media.*.url').optional({ values: 'falsy' }).trim().isLength({ max: 500 }),
    body('media.*.type').optional({ values: 'falsy' }).isIn(['image', 'video']),
  ],
  validateRequest,
  reviewsController.createReview
);

router.get('/my', requireAuth, reviewsController.getMyReviews);

router.get('/eligible', requireAuth, reviewsController.getEligibleReviewItems);

router.patch(
  '/:reviewId',
  requireAuth,
  reviewLimiter,
  [
    param('reviewId').isInt({ min: 1 }),
    body('rating').isInt({ min: 1, max: 5 }),
    body('comment').trim().notEmpty(),
    body('imageUrl').optional({ values: 'falsy' }).trim().isLength({ max: 500 }),
    body('media').optional().isArray({ max: 6 }),
    body('media.*.url').optional({ values: 'falsy' }).trim().isLength({ max: 500 }),
    body('media.*.type').optional({ values: 'falsy' }).isIn(['image', 'video']),
  ],
  validateRequest,
  reviewsController.updateMyReview
);

router.delete(
  '/:reviewId',
  requireAuth,
  reviewLimiter,
  [param('reviewId').isInt({ min: 1 })],
  validateRequest,
  reviewsController.deleteMyReview
);

module.exports = router;
