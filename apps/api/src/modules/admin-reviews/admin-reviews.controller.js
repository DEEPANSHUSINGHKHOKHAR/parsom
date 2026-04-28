const reviewsService = require('./admin-reviews.service');
const { writeAuditLog } = require('../../utils/audit-log');

async function listReviews(req, res, next) {
  try {
    const data = await reviewsService.listReviews({
      search: req.query.search || '',
      isPublished: req.query.isPublished || '',
    });

    res.status(200).json({
      success: true,
      message: 'Admin reviews fetched successfully.',
      data,
    });
  } catch (error) {
    next(error);
  }
}

async function updateReviewPublishState(req, res, next) {
  try {
    const data = await reviewsService.updateReviewPublishState(
      req.params.reviewId,
      req.body
    );

    await writeAuditLog({
      actorType: 'admin',
      actorId: req.user.id,
      actionKey: 'reviews.publish',
      resourceType: 'review',
      resourceId: data.reviewId,
      req,
      meta: {
        isPublished: data.isPublished,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Review publish state updated successfully.',
      data,
    });
  } catch (error) {
    next(error);
  }
}

async function updateReviewReply(req, res, next) {
  try {
    const data = await reviewsService.updateReviewReply(
      req.params.reviewId,
      req.body
    );

    await writeAuditLog({
      actorType: 'admin',
      actorId: req.user.id,
      actionKey: 'reviews.reply',
      resourceType: 'review',
      resourceId: data.reviewId,
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Review reply updated successfully.',
      data,
    });
  } catch (error) {
    next(error);
  }
}

async function deleteReview(req, res, next) {
  try {
    const data = await reviewsService.deleteReview(req.params.reviewId);

    await writeAuditLog({
      actorType: 'admin',
      actorId: req.user.id,
      actionKey: 'reviews.delete',
      resourceType: 'review',
      resourceId: data.reviewId,
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully.',
      data,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listReviews,
  updateReviewPublishState,
  updateReviewReply,
  deleteReview,
};
