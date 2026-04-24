const express = require('express');
const multer = require('multer');
const { requireAuth } = require('../../middleware/auth.middleware');
const controller = require('./uploads.controller');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

router.post(
  '/review-image',
  requireAuth,
  upload.single('file'),
  controller.uploadReviewImage
);

module.exports = router;