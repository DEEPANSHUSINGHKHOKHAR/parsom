const express = require('express');
const { body, param } = require('express-validator');

const adminController = require('./admin.controller');
const validateRequest = require('../../middleware/validate-request.middleware');
const { requireAuth } = require('../../middleware/auth.middleware');
const { requirePermission } = require('../../middleware/admin-permission.middleware');

const router = express.Router();

router.use(requireAuth);

router.get('/products', requirePermission('products.read'), adminController.listProducts);

router.get(
  '/products/deleted',
  requirePermission('products.read'),
  adminController.listDeletedProducts
);

router.get(
  '/products/:productId',
  requirePermission('products.read'),
  [param('productId').isInt({ min: 1 })],
  validateRequest,
  adminController.getProductById
);

router.post(
  '/products',
  requirePermission('products.write'),
  [
    body('categoryId').isInt({ min: 1 }).withMessage('must be a valid category.'),
    body('name').trim().notEmpty().withMessage('is required.').isLength({ max: 180 }),
    body('slug').optional({ values: 'falsy' }).trim().isLength({ max: 220 }),
    body('shortDescription').optional({ values: 'falsy' }).trim().isLength({ max: 500 }),
    body('description').optional({ values: 'falsy' }).trim(),
    body('materialDetails').optional({ values: 'falsy' }).trim(),
    body('careDetails').optional({ values: 'falsy' }).trim(),
    body('shippingNotes').optional({ values: 'falsy' }).trim(),
    body('price').isFloat({ min: 0 }).withMessage('must be a valid price.'),
    body('discountPrice').optional({ values: 'falsy' }).isFloat({ min: 0 }),
    body('costPrice').optional({ values: 'falsy' }).isFloat({ min: 0 }),
    body('makingPrice').optional({ values: 'falsy' }).isFloat({ min: 0 }),
    body('deliveryPrice').optional({ values: 'falsy' }).isFloat({ min: 0 }),
    body('packingPrice').optional({ values: 'falsy' }).isFloat({ min: 0 }),
    body('profitMargin').optional({ values: 'falsy' }).isFloat({ min: 0 }),
    body('paymentGatewayPrice').optional({ values: 'falsy' }).isFloat({ min: 0 }),
    body('sellingPrice').optional({ values: 'falsy' }).isFloat({ min: 0 }),
    body('finalSellingPrice').optional({ values: 'falsy' }).isFloat({ min: 0 }),
    body('roundedSellingPrice').optional({ values: 'falsy' }).isFloat({ min: 0 }),
    body('mrpMode').optional().isIn(['amount', 'percentage']),
    body('mrpValue').optional({ values: 'falsy' }).isFloat({ min: 0 }),
    body('status').optional().isIn(['active', 'inactive', 'coming_soon']),
    body('isActive').optional().isBoolean(),
    body('isFeatured').optional().isBoolean(),
    body('isTrending').optional().isBoolean(),
    body('videoUrl').optional({ values: 'falsy' }).trim().isLength({ max: 500 }),
    body('seoTitle').optional({ values: 'falsy' }).trim().isLength({ max: 255 }),
    body('seoDescription').optional({ values: 'falsy' }).trim().isLength({ max: 500 }),
    body('seoImage').optional({ values: 'falsy' }).trim().isLength({ max: 500 }),
    body('sortOrder').optional().isInt({ min: 0 }),
    body('images').optional().isArray(),
    body('sizes').optional().isArray(),
    body('sizes.*.size').optional().trim().isLength({ max: 20 }),
    body('sizes.*.mode').optional().isIn(['stock', 'notify', 'hidden']),
    body('sizes.*.stockQty').optional().isInt({ min: 0 }),
    body('sizes.*.reservedQty').optional().isInt({ min: 0 }),
    body('sizes.*.lowStockThreshold').optional().isInt({ min: 0 }),
    body('sizes.*.isActive').optional().isBoolean(),
  ],
  validateRequest,
  adminController.createProduct
);

router.patch(
  '/products/:productId',
  requirePermission('products.write'),
  [
    param('productId').isInt({ min: 1 }),
    body('categoryId').optional({ values: 'falsy' }).isInt({ min: 1 }),
    body('name').optional().trim().notEmpty().isLength({ max: 180 }),
    body('slug').optional().trim().notEmpty().isLength({ max: 220 }),
    body('price').optional().isFloat({ min: 0 }),
    body('discountPrice').optional({ values: 'falsy' }).isFloat({ min: 0 }),
    body('costPrice').optional({ values: 'falsy' }).isFloat({ min: 0 }),
    body('makingPrice').optional({ values: 'falsy' }).isFloat({ min: 0 }),
    body('deliveryPrice').optional({ values: 'falsy' }).isFloat({ min: 0 }),
    body('packingPrice').optional({ values: 'falsy' }).isFloat({ min: 0 }),
    body('profitMargin').optional({ values: 'falsy' }).isFloat({ min: 0 }),
    body('paymentGatewayPrice').optional({ values: 'falsy' }).isFloat({ min: 0 }),
    body('sellingPrice').optional({ values: 'falsy' }).isFloat({ min: 0 }),
    body('finalSellingPrice').optional({ values: 'falsy' }).isFloat({ min: 0 }),
    body('roundedSellingPrice').optional({ values: 'falsy' }).isFloat({ min: 0 }),
    body('mrpMode').optional().isIn(['amount', 'percentage']),
    body('mrpValue').optional({ values: 'falsy' }).isFloat({ min: 0 }),
    body('status').optional().isIn(['active', 'inactive', 'coming_soon']),
    body('isActive').optional().isBoolean(),
    body('isFeatured').optional().isBoolean(),
    body('isTrending').optional().isBoolean(),
    body('sortOrder').optional().isInt({ min: 0 }),
    body('images').optional().isArray(),
    body('sizes').optional().isArray(),
    body('sizes.*.size').optional().trim().isLength({ max: 20 }),
    body('sizes.*.mode').optional().isIn(['stock', 'notify', 'hidden']),
    body('sizes.*.stockQty').optional().isInt({ min: 0 }),
    body('sizes.*.reservedQty').optional().isInt({ min: 0 }),
    body('sizes.*.lowStockThreshold').optional().isInt({ min: 0 }),
    body('sizes.*.isActive').optional().isBoolean(),
  ],
  validateRequest,
  adminController.updateProduct
);

router.delete(
  '/products/:productId',
  requirePermission('products.write'),
  [param('productId').isInt({ min: 1 })],
  validateRequest,
  adminController.deleteProduct
);

router.patch(
  '/products/:productId/restore',
  requirePermission('products.write'),
  [param('productId').isInt({ min: 1 })],
  validateRequest,
  adminController.restoreProduct
);

router.delete(
  '/products/:productId/permanent',
  requirePermission('products.write'),
  [param('productId').isInt({ min: 1 })],
  validateRequest,
  adminController.permanentlyDeleteProduct
);

router.get('/orders', requirePermission('orders.read'), adminController.listOrders);

router.get(
  '/orders/:orderNumber',
  requirePermission('orders.read'),
  [param('orderNumber').trim().notEmpty()],
  validateRequest,
  adminController.getOrderByNumber
);

router.patch(
  '/orders/:orderNumber/status',
  requirePermission('orders.update'),
  [
    param('orderNumber').trim().notEmpty(),
    body('status').isIn(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']),
    body('trackingCode').optional({ values: 'falsy' }).trim().isLength({ max: 100 }),
    body('cancelReason').optional({ values: 'falsy' }).trim().isLength({ max: 500 }),
  ],
  validateRequest,
  adminController.updateOrderStatus
);

router.get(
  '/return-requests',
  requirePermission('returns.read'),
  adminController.listReturnRequests
);

router.patch(
  '/return-requests/:returnRequestId',
  requirePermission('returns.update'),
  [
    param('returnRequestId').isInt({ min: 1 }),
    body('status').isIn(['pending', 'approved', 'rejected', 'completed']),
    body('adminNotes').optional({ values: 'falsy' }).trim(),
  ],
  validateRequest,
  adminController.updateReturnRequest
);

router.get(
  '/storefront/settings',
  requirePermission('storefront.read'),
  adminController.getStorefrontSettings
);

router.patch(
  '/storefront/settings',
  requirePermission('storefront.write'),
  [body('velocityBanner.entries').optional().isArray({ max: 12 })],
  validateRequest,
  adminController.updateStorefrontSettings
);

router.get('/notify-requests', requirePermission('notify.read'), adminController.listNotifyRequests);

router.patch(
  '/notify-requests/:notifyRequestId/status',
  requirePermission('notify.update'),
  [
    param('notifyRequestId').isInt({ min: 1 }),
    body('status').isIn(['pending', 'read', 'stock_updated', 'contacted', 'completed']),
    body('adminNotes').optional({ values: 'falsy' }).trim(),
  ],
  validateRequest,
  adminController.updateNotifyStatus
);

module.exports = router;
