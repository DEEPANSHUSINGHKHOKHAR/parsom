const express = require('express');

const controller = require('./admin-wishlist.controller');
const { requireAuth } = require('../../middleware/auth.middleware');
const { requirePermission } = require('../../middleware/admin-permission.middleware');

const router = express.Router();

router.use(requireAuth);

router.get('/', requirePermission('wishlist.read'), controller.listWishlistInsights);

module.exports = router;
