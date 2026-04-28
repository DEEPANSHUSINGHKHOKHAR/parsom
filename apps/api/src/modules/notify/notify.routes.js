const express = require('express');
const { body } = require('express-validator');

const notifyController = require('./notify.controller');
const validateRequest = require('../../middleware/validate-request.middleware');
const { optionalAuth, requireAuth } = require('../../middleware/auth.middleware');
const { notifyLimiter } = require('../../middleware/rate-limit.middleware');

const router = express.Router();

router.post(
  '/',
  optionalAuth,
  notifyLimiter,
  [
    body('productId').isInt({ min: 1 }),
    body('requestedSize').trim().notEmpty().isLength({ max: 20 }),
    body('fullName').trim().notEmpty().isLength({ max: 160 }),
    body('email').trim().isEmail().normalizeEmail(),
    body('phone').trim().notEmpty().isLength({ max: 30 }),
  ],
  validateRequest,
  notifyController.createNotifyRequest
);

router.get('/my', requireAuth, notifyController.getMyNotifyRequests);

module.exports = router;
