const uploadsService = require('./uploads.service');

async function uploadReviewImage(req, res, next) {
  try {
    const data = await uploadsService.uploadReviewImage(req.file);

    res.status(201).json({
      success: true,
      message: 'Review image uploaded successfully.',
      data,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  uploadReviewImage,
};