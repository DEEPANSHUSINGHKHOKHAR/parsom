const express = require('express');
const { body, param } = require('express-validator');

const controller = require('./admin-reviews.controller');
const validateRequest = require('../../middleware/validate-request.middleware');
const { requireAuth } = require('../../middleware/auth.middleware');
const { requirePermission } = require('../../middleware/admin-permission.middleware');

const router = express.Router();

router.use(requireAuth);

router.get('/', requirePermission('reviews.read'), controller.listReviews);

router.post(
  '/',
  requirePermission('reviews.moderate'),
  [
    body('reviewerName').trim().notEmpty().isLength({ max: 160 }),
    body('reviewerEmail').optional({ values: 'falsy' }).trim().isEmail().isLength({ max: 190 }),
    body('reviewerAvatarUrl').optional({ values: 'falsy' }).trim().isLength({ max: 500 }),
    body('rating').isInt({ min: 1, max: 5 }),
    body('comment').trim().notEmpty(),
    body('source').optional({ values: 'falsy' }).trim().isIn(['admin', 'outside', 'customer']),
    body('platform').optional({ values: 'falsy' }).trim().isLength({ max: 40 }),
    body('isPublished').isBoolean(),
  ],
  validateRequest,
  controller.createWebsiteReview
);

router.patch(
  '/:reviewId',
  requirePermission('reviews.moderate'),
  [
    param('reviewId').isInt({ min: 1 }),
    body('reviewerName').trim().notEmpty().isLength({ max: 160 }),
    body('reviewerEmail').optional({ values: 'falsy' }).trim().isEmail().isLength({ max: 190 }),
    body('reviewerAvatarUrl').optional({ values: 'falsy' }).trim().isLength({ max: 500 }),
    body('rating').isInt({ min: 1, max: 5 }),
    body('comment').trim().notEmpty(),
    body('source').optional({ values: 'falsy' }).trim().isIn(['admin', 'outside', 'customer']),
    body('platform').optional({ values: 'falsy' }).trim().isLength({ max: 40 }),
    body('isPublished').isBoolean(),
  ],
  validateRequest,
  controller.updateWebsiteReview
);

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

router.patch(
  '/:reviewId/reply',
  requirePermission('reviews.moderate'),
  [
    param('reviewId').isInt({ min: 1 }),
    body('adminReply').optional({ values: 'falsy' }).trim().isLength({ max: 1000 }),
  ],
  validateRequest,
  controller.updateReviewReply
);

router.delete(
  '/:reviewId',
  requirePermission('reviews.moderate'),
  [param('reviewId').isInt({ min: 1 })],
  validateRequest,
  controller.deleteReview
);

module.exports = router;
