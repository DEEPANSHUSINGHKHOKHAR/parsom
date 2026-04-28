const express = require('express');

const controller = require('./admin-analytics.controller');
const { requireAuth } = require('../../middleware/auth.middleware');
const { requirePermission } = require('../../middleware/admin-permission.middleware');

const router = express.Router();

router.use(requireAuth);

router.get('/overview', requirePermission('analytics.read'), controller.getOverview);

module.exports = router;
