const express = require('express');
const { body, param } = require('express-validator');

const controller = require('./admin-contact.controller');
const validateRequest = require('../../middleware/validate-request.middleware');
const { requireAuth } = require('../../middleware/auth.middleware');
const { requirePermission } = require('../../middleware/admin-permission.middleware');

const router = express.Router();

router.use(requireAuth);

router.get('/', requirePermission('contacts.read'), controller.listContactSubmissions);

router.patch(
  '/:contactSubmissionId',
  requirePermission('contacts.update'),
  [
    param('contactSubmissionId').isInt({ min: 1 }),
    body('status').isIn(['new', 'in_progress', 'resolved', 'closed']),
    body('adminNotes').optional({ values: 'falsy' }).trim(),
  ],
  validateRequest,
  controller.updateContactSubmission
);

module.exports = router;
