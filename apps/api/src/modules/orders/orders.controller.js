const ordersService = require('./orders.service');
const { buildInvoicePdfBuffer } = require('../../utils/pdf-invoice');

async function createOrder(req, res, next) {
  try {
    const data = await ordersService.createOrder(req.body, req.user || null);

    res.status(201).json({
      success: true,
      message: 'Order created successfully.',
      data
    });
  } catch (error) {
    next(error);
  }
}

async function getMyOrders(req, res, next) {
  try {
    const data = await ordersService.getMyOrders(req.user);

    res.status(200).json({
      success: true,
      message: 'Orders fetched successfully.',
      data
    });
  } catch (error) {
    next(error);
  }
}

async function getMyOrderByNumber(req, res, next) {
  try {
    const data = await ordersService.getMyOrderByNumber(
      req.user,
      req.params.orderNumber
    );

    res.status(200).json({
      success: true,
      message: 'Order fetched successfully.',
      data
    });
  } catch (error) {
    next(error);
  }
}
async function getMyOrderInvoice(req, res, next) {
  try {
    const html = await ordersService.getMyOrderInvoiceHtml(
      req.user,
      req.params.orderNumber
    );

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${req.params.orderNumber}-invoice.html"`
    );
    res.status(200).send(html);
  } catch (error) {
    next(error);
  }
}

async function getMyOrderInvoicePdf(req, res, next) {
  try {
    const order = await ordersService.getMyOrderByNumber(
      req.user,
      req.params.orderNumber
    );

    const pdfBuffer = await buildInvoicePdfBuffer(order);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${req.params.orderNumber}-invoice.pdf"`
    );
    res.status(200).send(pdfBuffer);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createOrder,
  getMyOrders,
  getMyOrderByNumber,
  getMyOrderInvoice,
  getMyOrderInvoicePdf,
};
