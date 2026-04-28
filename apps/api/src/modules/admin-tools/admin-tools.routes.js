const express = require('express');
const multer = require('multer');

const controller = require('./admin-tools.controller');
const { requireAuth } = require('../../middleware/auth.middleware');
const { requirePermission } = require('../../middleware/admin-permission.middleware');
const { uploadLimiter } = require('../../middleware/rate-limit.middleware');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024,
  },
  fileFilter: (req, file, callback) => {
    if (
      file.mimetype.startsWith('image/') ||
      file.mimetype.startsWith('video/')
    ) {
      callback(null, true);
      return;
    }

    callback(new Error('Only image and video uploads are supported.'));
  },
});

router.use(requireAuth);

router.get('/exports/orders.csv', requirePermission('tools.read'), controller.exportOrdersCsv);
router.get(
  '/exports/notify-requests.csv',
  requirePermission('tools.read'),
  controller.exportNotifyRequestsCsv
);
router.post(
  '/uploads/media',
  requirePermission('tools.upload'),
  uploadLimiter,
  upload.single('file'),
  controller.uploadMedia
);

module.exports = router;
