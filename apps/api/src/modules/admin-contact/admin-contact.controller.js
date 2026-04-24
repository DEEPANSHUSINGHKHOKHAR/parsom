const service = require('./admin-contact.service');
const { writeAuditLog } = require('../../utils/audit-log');

async function listContactSubmissions(req, res, next) {
  try {
    const data = await service.listContactSubmissions({
      search: req.query.search || '',
      status: req.query.status || '',
    });

    res.status(200).json({
      success: true,
      message: 'Contact submissions fetched successfully.',
      data,
    });
  } catch (error) {
    next(error);
  }
}

async function updateContactSubmission(req, res, next) {
  try {
    const data = await service.updateContactSubmission(
      req.params.contactSubmissionId,
      req.body
    );

    await writeAuditLog({
      actorType: 'admin',
      actorId: req.user.id,
      actionKey: 'contacts.update',
      resourceType: 'contact_submission',
      resourceId: data.contactSubmissionId,
      req,
      meta: req.body,
    });

    res.status(200).json({
      success: true,
      message: 'Contact submission updated successfully.',
      data,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listContactSubmissions,
  updateContactSubmission,
};
