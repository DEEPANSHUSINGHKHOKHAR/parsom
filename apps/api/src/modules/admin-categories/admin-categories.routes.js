const express = require('express');
const { body, param } = require('express-validator');

const controller = require('./admin-categories.controller');
const validateRequest = require('../../middleware/validate-request.middleware');
const { requireAuth } = require('../../middleware/auth.middleware');
const { requirePermission } = require('../../middleware/admin-permission.middleware');

const router = express.Router();

router.use(requireAuth);

router.get('/', requirePermission('categories.read'), controller.listCategories);

router.post(
  '/',
  requirePermission('categories.write'),
  [
    body('name').trim().notEmpty().isLength({ max: 160 }),
    body('audience').isIn(['women', 'men', 'kids']),
    body('parentId').optional({ nullable: true }).isInt({ min: 1 }),
    body('badge').optional().isIn(['', 'new', 'soon']),
    body('isActive').optional().isBoolean(),
  ],
  validateRequest,
  controller.createCategory
);

router.patch(
  '/:categoryId',
  requirePermission('categories.write'),
  [
    param('categoryId').isInt({ min: 1 }),
    body('name').optional().trim().notEmpty().isLength({ max: 160 }),
    body('audience').optional().isIn(['women', 'men', 'kids']),
    body('parentId').optional({ nullable: true }).isInt({ min: 1 }),
    body('badge').optional().isIn(['', 'new', 'soon']),
    body('isActive').optional().isBoolean(),
  ],
  validateRequest,
  controller.updateCategory
);

router.delete(
  '/:categoryId',
  requirePermission('categories.write'),
  [param('categoryId').isInt({ min: 1 })],
  validateRequest,
  controller.deleteCategory
);

module.exports = router;
