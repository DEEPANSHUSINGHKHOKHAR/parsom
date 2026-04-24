const express = require('express');
const { body, param } = require('express-validator');

const controller = require('./admin-reviews.controller');
const validateRequest = require('../../middleware/validate-request.middleware');
const { requireAuth } = require('../../middleware/auth.middleware');
const { requirePermission } = require('../../middleware/admin-permission.middleware');

const router = express.Router();

router.use(requireAuth);

router.get('/', requirePermission('reviews.read'), controller.listReviews);

router.patch(
  '/:reviewId/publish',
  requirePermission('reviews.moderate'),
  [
    param('reviewId').isInt({ min: 1 }),
    body('isPublished').isBoolean(),
  ],
  validateRequest,
  controller.updateReviewPublishState
);

router.delete(
  '/:reviewId',
  requirePermission('reviews.moderate'),
  [param('reviewId').isInt({ min: 1 })],
  validateRequest,
  controller.deleteReview
);

module.exports = router;
