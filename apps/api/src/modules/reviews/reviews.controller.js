const reviewsService = require('./reviews.service');

async function createReview(req, res, next) {
  try {
    const data = await reviewsService.createReview(req.body, req.user);

    res.status(201).json({
      success: true,
      message: 'Review created successfully.',
      data,
    });
  } catch (error) {
    next(error);
  }
}

async function getMyReviews(req, res, next) {
  try {
    const data = await reviewsService.getMyReviews(req.user);

    res.status(200).json({
      success: true,
      message: 'Reviews fetched successfully.',
      data,
    });
  } catch (error) {
    next(error);
  }
}

async function getEligibleReviewItems(req, res, next) {
  try {
    const data = await reviewsService.getEligibleReviewItems(req.user);

    res.status(200).json({
      success: true,
      message: 'Eligible review items fetched successfully.',
      data,
    });
  } catch (error) {
    next(error);
  }
}

async function updateMyReview(req, res, next) {
  try {
    const data = await reviewsService.updateMyReview(
      req.params.reviewId,
      req.body,
      req.user
    );

    res.status(200).json({
      success: true,
      message: 'Review updated successfully.',
      data,
    });
  } catch (error) {
    next(error);
  }
}

async function deleteMyReview(req, res, next) {
  try {
    const data = await reviewsService.deleteMyReview(req.params.reviewId, req.user);

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
  createReview,
  getMyReviews,
  getEligibleReviewItems,
  updateMyReview,
  deleteMyReview,
};
