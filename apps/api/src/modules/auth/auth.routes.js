const express = require('express');
const { body } = require('express-validator');

const authController = require('./auth.controller');
const validateRequest = require('../../middleware/validate-request.middleware');
const { requireAuth } = require('../../middleware/auth.middleware');
const { authLimiter } = require('../../middleware/rate-limit.middleware');

const router = express.Router();

const strongPasswordRule = (field) =>
  body(field)
    .isLength({ min: 8, max: 100 })
    .withMessage('must be 8-100 characters')
    .matches(/[a-z]/)
    .withMessage('must contain a lowercase letter')
    .matches(/[A-Z]/)
    .withMessage('must contain an uppercase letter')
    .matches(/[0-9]/)
    .withMessage('must contain a number');

router.post(
  '/register',
  [
    body('firstName').trim().notEmpty().isLength({ max: 120 }),
    body('lastName').trim().notEmpty().isLength({ max: 120 }),
    body('email').trim().isEmail().normalizeEmail(),
    body('phone').trim().notEmpty().isLength({ max: 30 }),
    strongPasswordRule('password')
  ],
  validateRequest,
  authController.register
);

router.post(
  '/login',
  authLimiter,
  [
    body('email').trim().isEmail().normalizeEmail(),
    body('password').isLength({ min: 8, max: 100 })
  ],
  validateRequest,
  authController.login
);

router.post(
  '/phone/check',
  authLimiter,
  [body('phone').trim().notEmpty().isLength({ max: 30 })],
  validateRequest,
  authController.checkPhone
);

router.post(
  '/phone/login',
  authLimiter,
  [
    body('phone').trim().notEmpty().isLength({ max: 30 }),
    body('password').isLength({ min: 8, max: 100 })
  ],
  validateRequest,
  authController.phoneLogin
);

router.post(
  '/google',
  authLimiter,
  [body('credential').trim().notEmpty().isJWT()],
  validateRequest,
  authController.googleLogin
);

router.post(
  '/admin/login',
  authLimiter,
  [
    body('email').trim().isEmail().normalizeEmail(),
    body('password').isLength({ min: 8, max: 100 })
  ],
  validateRequest,
  authController.adminLogin
);

router.post('/admin/logout', authController.adminLogout);

router.get('/me', requireAuth, authController.me);

router.post(
  '/password/change',
  authLimiter,
  requireAuth,
  [
    body('currentPassword')
      .optional({ values: 'falsy' })
      .isLength({ min: 8, max: 100 }),
    strongPasswordRule('newPassword'),
    body('skipCurrentPassword').optional().isBoolean(),
  ],
  validateRequest,
  authController.changePassword
);

router.delete(
  '/me',
  authLimiter,
  requireAuth,
  [
    body('currentPassword')
      .optional({ values: 'falsy' })
      .isLength({ min: 8, max: 100 }),
    body('skipCurrentPassword').optional().isBoolean(),
  ],
  validateRequest,
  authController.deleteAccount
);

module.exports = router;
