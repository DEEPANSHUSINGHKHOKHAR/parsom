const service = require('./admin-wishlist.service');

async function listWishlistInsights(req, res, next) {
  try {
    const data = await service.listWishlistInsights({
      search: req.query.search || '',
    });

    res.status(200).json({
      success: true,
      message: 'Wishlist insights fetched successfully.',
      data,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listWishlistInsights,
};