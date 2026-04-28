const storefrontService = require('./storefront.service');

async function getStorefrontSettings(req, res, next) {
  try {
    const data = await storefrontService.getStorefrontSettings();

    res.status(200).json({
      success: true,
      message: 'Storefront settings fetched successfully.',
      data,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getStorefrontSettings,
};
