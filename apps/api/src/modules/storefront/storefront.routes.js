const express = require('express');

const controller = require('./storefront.controller');

const router = express.Router();

router.get('/settings', controller.getStorefrontSettings);

module.exports = router;
