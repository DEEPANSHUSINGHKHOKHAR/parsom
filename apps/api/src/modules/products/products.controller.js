const productsService = require('./products.service');

async function getProducts(req, res, next) {
  try {
    const data = await productsService.listProducts({
      search: req.query.search || '',
      category: req.query.category || '',
      availability: req.query.availability || 'all',
      sort: req.query.sort || 'latest'
    });

    res.status(200).json({
      success: true,
      message: 'Products fetched successfully.',
      data
    });
  } catch (error) {
    next(error);
  }
}

async function getProductCategories(req, res, next) {
  try {
    const data = await productsService.listPublicCategories();

    res.status(200).json({
      success: true,
      message: 'Product categories fetched successfully.',
      data
    });
  } catch (error) {
    next(error);
  }
}

async function getProduct(req, res, next) {
  try {
    const data = await productsService.getProductBySlug(req.params.slug);

    res.status(200).json({
      success: true,
      message: 'Product fetched successfully.',
      data
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getProducts,
  getProductCategories,
  getProduct
};
