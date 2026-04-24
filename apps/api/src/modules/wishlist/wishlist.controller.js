const wishlistService = require('./wishlist.service');

async function addWishlistItem(req, res, next) {
  try {
    const data = await wishlistService.addWishlistItem(req.body.productId, req.user);

    res.status(201).json({
      success: true,
      message: 'Wishlist item added successfully.',
      data,
    });
  } catch (error) {
    next(error);
  }
}

async function getMyWishlist(req, res, next) {
  try {
    const data = await wishlistService.getMyWishlist(req.user);

    res.status(200).json({
      success: true,
      message: 'Wishlist fetched successfully.',
      data,
    });
  } catch (error) {
    next(error);
  }
}

async function removeWishlistItem(req, res, next) {
  try {
    const data = await wishlistService.removeWishlistItem(
      req.params.productId,
      req.user
    );

    res.status(200).json({
      success: true,
      message: 'Wishlist item removed successfully.',
      data,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  addWishlistItem,
  getMyWishlist,
  removeWishlistItem,
};