const express = require('express');
const multer = require('multer');
const { requireAuth } = require('../../middleware/auth.middleware');
const { uploadLimiter } = require('../../middleware/rate-limit.middleware');
const AppError = require('../../utils/app-error');
const controller = require('./uploads.controller');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
  fileFilter: (req, file, callback) => {
    if (file.mimetype.startsWith('image/')) {
      callback(null, true);
      return;
    }

    callback(new AppError(422, 'Only image uploads are supported for reviews.'));
  },
});

router.post(
  '/review-image',
  requireAuth,
  uploadLimiter,
  upload.single('file'),
  controller.uploadReviewImage
);

module.exports = router;
