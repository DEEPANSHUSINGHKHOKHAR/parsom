const express = require('express');
const multer = require('multer');

const controller = require('./admin-tools.controller');
const { requireAuth } = require('../../middleware/auth.middleware');
const { requirePermission } = require('../../middleware/admin-permission.middleware');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024,
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
  upload.single('file'),
  controller.uploadMedia
);

module.exports = router;
