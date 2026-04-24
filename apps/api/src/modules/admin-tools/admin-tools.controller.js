const toolsService = require('./admin-tools.service');

async function exportOrdersCsv(req, res, next) {
  try {
    const csv = await toolsService.exportOrdersCsv();

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="orders.csv"');
    res.status(200).send(csv);
  } catch (error) {
    next(error);
  }
}

async function exportNotifyRequestsCsv(req, res, next) {
  try {
    const csv = await toolsService.exportNotifyRequestsCsv();

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="notify-requests.csv"');
    res.status(200).send(csv);
  } catch (error) {
    next(error);
  }
}

async function uploadMedia(req, res, next) {
  try {
    const data = await toolsService.uploadMedia(req.file);

    res.status(201).json({
      success: true,
      message: 'Media uploaded successfully.',
      data,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  exportOrdersCsv,
  exportNotifyRequestsCsv,
  uploadMedia,
};