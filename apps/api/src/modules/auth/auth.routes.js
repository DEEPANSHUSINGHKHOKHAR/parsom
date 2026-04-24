const express = require('express');
const { body } = require('express-validator');

const authController = require('./auth.controller');
const validateRequest = require('../../middleware/validate-request.middleware');
const { requireAuth } = require('../../middleware/auth.middleware');

const router = express.Router();

router.post(
  '/register',
  [
    body('firstName').trim().notEmpty().isLength({ max: 120 }),
    body('lastName').trim().notEmpty().isLength({ max: 120 }),
    body('email').trim().isEmail().normalizeEmail(),
    body('phone').optional({ values: 'falsy' }).trim().isLength({ max: 30 }),
    body('password').isLength({ min: 8, max: 100 })
  ],
  validateRequest,
  authController.register
);

router.post(
  '/login',
  [
    body('email').trim().isEmail().normalizeEmail(),
    body('password').isLength({ min: 8, max: 100 })
  ],
  validateRequest,
  authController.login
);

router.post(
  '/admin/login',
  [
    body('email').trim().isEmail().normalizeEmail(),
    body('password').isLength({ min: 8, max: 100 })
  ],
  validateRequest,
  authController.adminLogin
);

router.get('/me', requireAuth, authController.me);

router.post(
  '/forgot-password/request-otp',
  [body('email').trim().isEmail().normalizeEmail()],
  validateRequest,
  authController.requestPasswordResetOtp
);

router.post(
  '/forgot-password/reset',
  [
    body('email').trim().isEmail().normalizeEmail(),
    body('otp').trim().isLength({ min: 6, max: 6 }),
    body('newPassword').isLength({ min: 8, max: 100 }),
  ],
  validateRequest,
  authController.resetPasswordWithOtp
);

router.post(
  '/whatsapp/request-otp',
  [body('phone').trim().notEmpty().isLength({ max: 30 })],
  validateRequest,
  authController.requestWhatsappLoginOtp
);

router.post(
  '/whatsapp/verify-otp',
  [
    body('phone').trim().notEmpty().isLength({ max: 30 }),
    body('otp').trim().notEmpty().isLength({ min: 4, max: 10 }),
  ],
  validateRequest,
  authController.verifyWhatsappLoginOtp
);

module.exports = router;