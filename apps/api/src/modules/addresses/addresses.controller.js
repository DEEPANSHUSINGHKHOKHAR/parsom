const addressesService = require('./addresses.service');

async function getMyAddresses(req, res, next) {
  try {
    const data = await addressesService.getMyAddresses(req.user);

    res.status(200).json({
      success: true,
      message: 'Addresses fetched successfully.',
      data,
    });
  } catch (error) {
    next(error);
  }
}

async function createAddress(req, res, next) {
  try {
    const data = await addressesService.createAddress(req.body, req.user);

    res.status(201).json({
      success: true,
      message: 'Address created successfully.',
      data,
    });
  } catch (error) {
    next(error);
  }
}

async function updateAddress(req, res, next) {
  try {
    const data = await addressesService.updateAddress(
      req.params.addressId,
      req.body,
      req.user
    );

    res.status(200).json({
      success: true,
      message: 'Address updated successfully.',
      data,
    });
  } catch (error) {
    next(error);
  }
}

async function setDefaultAddress(req, res, next) {
  try {
    const data = await addressesService.setDefaultAddress(
      req.params.addressId,
      req.user
    );

    res.status(200).json({
      success: true,
      message: 'Default address updated successfully.',
      data,
    });
  } catch (error) {
    next(error);
  }
}

async function deleteAddress(req, res, next) {
  try {
    const data = await addressesService.deleteAddress(req.params.addressId, req.user);

    res.status(200).json({
      success: true,
      message: 'Address deleted successfully.',
      data,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getMyAddresses,
  createAddress,
  updateAddress,
  setDefaultAddress,
  deleteAddress,
};