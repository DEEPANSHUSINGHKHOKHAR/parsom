const express = require('express');
const { body } = require('express-validator');

const controller = require('./contact.controller');
const validateRequest = require('../../middleware/validate-request.middleware');
const { optionalAuth } = require('../../middleware/auth.middleware');

const router = express.Router();

router.post(
  '/',
  optionalAuth,
  [
    body('fullName').trim().notEmpty().isLength({ max: 160 }),
    body('email').trim().isEmail().normalizeEmail(),
    body('phone').optional({ values: 'falsy' }).trim().isLength({ max: 30 }),
    body('category').isIn(['order', 'collaboration', 'query']),
    body('message').trim().notEmpty(),
    body('attachmentUrl').optional({ values: 'falsy' }).trim().isLength({ max: 500 }),
  ],
  validateRequest,
  controller.createContactSubmission
);

module.exports = router;