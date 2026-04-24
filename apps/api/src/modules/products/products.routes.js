const express = require('express');
const productsController = require('./products.controller');

const router = express.Router();

router.get('/', productsController.getProducts);
router.get('/:slug', productsController.getProduct);

module.exports = router;