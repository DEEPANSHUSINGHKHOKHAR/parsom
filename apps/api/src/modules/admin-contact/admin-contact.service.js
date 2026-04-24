const { query } = require('../../config/db');
const AppError = require('../../utils/app-error');

async function listContactSubmissions(filters) {
  const conditions = ['cs.deleted_at IS NULL'];
  const params = [];

  if (filters.status) {
    conditions.push('cs.status = ?');
    params.push(filters.status);
  }

  if (filters.search) {
    conditions.push('(cs.full_name LIKE ? OR cs.email LIKE ? OR cs.phone LIKE ?)');
    const term = `%${filters.search}%`;
    params.push(term, term, term);
  }

  const rows = await query(
    `
      SELECT
        cs.id,
        cs.full_name AS fullName,
        cs.email,
        cs.phone,
        cs.category,
        cs.message,
        cs.attachment_path AS attachmentUrl,
        cs.status,
        cs.admin_note AS adminNotes,
        cs.created_at AS createdAt
      FROM contact_submissions cs
      WHERE ${conditions.join(' AND ')}
      ORDER BY cs.created_at DESC
    `,
    params
  );

  return rows.map((row) => ({
    ...row,
  }));
}

async function updateContactSubmission(contactSubmissionId, payload) {
  const existingRows = await query(
    `
      SELECT id
      FROM contact_submissions
      WHERE id = ?
        AND deleted_at IS NULL
      LIMIT 1
    `,
    [contactSubmissionId]
  );

  if (!existingRows[0]) {
    throw new AppError(404, 'Contact submission not found.');
  }

  await query(
    `
      UPDATE contact_submissions
      SET status = ?,
          admin_note = ?,
          updated_at = NOW()
      WHERE id = ?
    `,
    [payload.status, payload.adminNotes || null, contactSubmissionId]
  );

  return {
    contactSubmissionId: Number(contactSubmissionId),
    status: payload.status,
    adminNotes: payload.adminNotes || null,
  };
}

module.exports = {
  listContactSubmissions,
  updateContactSubmission,
};
