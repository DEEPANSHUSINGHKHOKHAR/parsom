const contactService = require('./contact.service');

async function createContactSubmission(req, res, next) {
  try {
    const data = await contactService.createContactSubmission(req.body, req.user || null);

    res.status(201).json({
      success: true,
      message: 'Contact submission created successfully.',
      data,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createContactSubmission,
};