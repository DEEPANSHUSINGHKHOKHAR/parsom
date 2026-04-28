const analyticsService = require('./admin-analytics.service');

async function getOverview(req, res, next) {
  try {
    const data = await analyticsService.getOverview();
    res.status(200).json({
      success: true,
      message: 'Analytics fetched successfully.',
      data,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getOverview,
};