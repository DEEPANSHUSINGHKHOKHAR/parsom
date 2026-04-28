const notifyService = require('./notify.service');

async function createNotifyRequest(req, res, next) {
  try {
    const data = await notifyService.createNotifyRequest(req.body, req.user || null);

    res.status(201).json({
      success: true,
      message: 'Notify request created successfully.',
      data,
    });
  } catch (error) {
    next(error);
  }
}

async function getMyNotifyRequests(req, res, next) {
  try {
    const data = await notifyService.getMyNotifyRequests(req.user);

    res.status(200).json({
      success: true,
      message: 'Notify requests fetched successfully.',
      data,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createNotifyRequest,
  getMyNotifyRequests,
};