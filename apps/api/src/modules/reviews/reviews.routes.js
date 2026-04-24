const express = require('express');
const { body, param } = require('express-validator');

const reviewsController = require('./reviews.controller');
const validateRequest = require('../../middleware/validate-request.middleware');
const { requireAuth } = require('../../middleware/auth.middleware');

const router = express.Router();

router.post(
  '/',
  requireAuth,
  [
    body('productId').isInt({ min: 1 }),
    body('orderItemId').isInt({ min: 1 }),
    body('rating').isInt({ min: 1, max: 5 }),
    body('comment').trim().notEmpty(),
    body('imageUrl').optional({ values: 'falsy' }).trim().isLength({ max: 500 }),
  ],
  validateRequest,
  reviewsController.createReview
);

router.get('/my', requireAuth, reviewsController.getMyReviews);

router.get('/eligible', requireAuth, reviewsController.getEligibleReviewItems);

router.patch(
  '/:reviewId',
  requireAuth,
  [
    param('reviewId').isInt({ min: 1 }),
    body('rating').isInt({ min: 1, max: 5 }),
    body('comment').trim().notEmpty(),
    body('imageUrl').optional({ values: 'falsy' }).trim().isLength({ max: 500 }),
  ],
  validateRequest,
  reviewsController.updateMyReview
);

router.delete(
  '/:reviewId',
  requireAuth,
  [param('reviewId').isInt({ min: 1 })],
  validateRequest,
  reviewsController.deleteMyReview
);

module.exports = router;
