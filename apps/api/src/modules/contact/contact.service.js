const { query } = require('../../config/db');

async function createContactSubmission(payload, actor) {
  const result = await query(
    `
      INSERT INTO contact_submissions (
        user_id,
        full_name,
        email,
        phone,
        category,
        message,
        attachment_path,
        status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, 'new')
    `,
    [
      actor?.role === 'user' ? actor.id : null,
      payload.fullName,
      payload.email,
      payload.phone || null,
      payload.category,
      payload.message,
      payload.attachmentUrl || null,
    ]
  );

  return {
    contactSubmissionId: result.insertId,
    status: 'new',
  };
}

module.exports = {
  createContactSubmission,
};
