const adminService = require('./admin.service');
const { writeAuditLog } = require('../../utils/audit-log');

async function listProducts(req, res, next) {
  try {
    const data = await adminService.listAdminProducts({
      search: req.query.search || '',
      status: req.query.status || '',
      categoryId: req.query.categoryId || '',
    });

    res.status(200).json({
      success: true,
      message: 'Admin products fetched successfully.',
      data,
    });
  } catch (error) {
    next(error);
  }
}

async function getProductById(req, res, next) {
  try {
    const data = await adminService.getAdminProductById(req.params.productId);

    res.status(200).json({
      success: true,
      message: 'Admin product fetched successfully.',
      data,
    });
  } catch (error) {
    next(error);
  }
}

async function createProduct(req, res, next) {
  try {
    const data = await adminService.createAdminProduct(req.body);

    await writeAuditLog({
      actorType: 'admin',
      actorId: req.user.id,
      actionKey: 'products.create',
      resourceType: 'product',
      resourceId: data.productId,
      req,
      meta: {
        name: req.body.name,
        slug: req.body.slug,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully.',
      data,
    });
  } catch (error) {
    next(error);
  }
}

async function updateProduct(req, res, next) {
  try {
    const data = await adminService.updateAdminProduct(
      req.params.productId,
      req.body
    );

    await writeAuditLog({
      actorType: 'admin',
      actorId: req.user.id,
      actionKey: 'products.update',
      resourceType: 'product',
      resourceId: data.productId,
      req,
      meta: req.body,
    });

    res.status(200).json({
      success: true,
      message: 'Product updated successfully.',
      data,
    });
  } catch (error) {
    next(error);
  }
}

async function deleteProduct(req, res, next) {
  try {
    const data = await adminService.softDeleteAdminProduct(req.params.productId);

    await writeAuditLog({
      actorType: 'admin',
      actorId: req.user.id,
      actionKey: 'products.delete',
      resourceType: 'product',
      resourceId: data.productId,
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully.',
      data,
    });
  } catch (error) {
    next(error);
  }
}

async function listOrders(req, res, next) {
  try {
    const data = await adminService.listAdminOrders({
      search: req.query.search || '',
      status: req.query.status || '',
    });

    res.status(200).json({
      success: true,
      message: 'Admin orders fetched successfully.',
      data,
    });
  } catch (error) {
    next(error);
  }
}

async function getOrderByNumber(req, res, next) {
  try {
    const data = await adminService.getAdminOrderByNumber(req.params.orderNumber);

    res.status(200).json({
      success: true,
      message: 'Admin order fetched successfully.',
      data,
    });
  } catch (error) {
    next(error);
  }
}

async function updateOrderStatus(req, res, next) {
  try {
    const data = await adminService.updateAdminOrderStatus(
      req.params.orderNumber,
      req.body
    );

    await writeAuditLog({
      actorType: 'admin',
      actorId: req.user.id,
      actionKey: 'orders.update_status',
      resourceType: 'order',
      resourceId: data.orderId,
      req,
      meta: {
        ...req.body,
        orderNumber: req.params.orderNumber,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Order status updated successfully.',
      data,
    });
  } catch (error) {
    next(error);
  }
}

async function listNotifyRequests(req, res, next) {
  try {
    const data = await adminService.listAdminNotifyRequests({
      search: req.query.search || '',
      status: req.query.status || '',
    });

    res.status(200).json({
      success: true,
      message: 'Admin notify requests fetched successfully.',
      data,
    });
  } catch (error) {
    next(error);
  }
}

async function updateNotifyStatus(req, res, next) {
  try {
    const data = await adminService.updateAdminNotifyStatus(
      req.params.notifyRequestId,
      req.body
    );

    await writeAuditLog({
      actorType: 'admin',
      actorId: req.user.id,
      actionKey: 'notify.update_status',
      resourceType: 'notify_request',
      resourceId: data.notifyRequestId,
      req,
      meta: req.body,
    });

    res.status(200).json({
      success: true,
      message: 'Notify request updated successfully.',
      data,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  listOrders,
  getOrderByNumber,
  updateOrderStatus,
  listNotifyRequests,
  updateNotifyStatus,
};
