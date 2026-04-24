const { query } = require('../../config/db');
const AppError = require('../../utils/app-error');

async function listCategories() {
  const rows = await query(
    `
      SELECT
        id,
        name,
        slug,
        is_active AS isActive,
        created_at AS createdAt
      FROM categories
      WHERE deleted_at IS NULL
      ORDER BY created_at DESC
    `
  );

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    isActive: Boolean(row.isActive),
    createdAt: row.createdAt,
  }));
}

async function createCategory(payload) {
  const existing = await query(
    `
      SELECT id
      FROM categories
      WHERE deleted_at IS NULL
        AND (name = ? OR slug = ?)
      LIMIT 1
    `,
    [payload.name, payload.slug]
  );

  if (existing[0]) {
    throw new AppError(409, 'Category name or slug already exists.');
  }

  const result = await query(
    `
      INSERT INTO categories (name, slug, is_active)
      VALUES (?, ?, ?)
    `,
    [payload.name, payload.slug, payload.isActive === false ? 0 : 1]
  );

  return { categoryId: result.insertId };
}

async function updateCategory(categoryId, payload) {
  const existingRows = await query(
    `
      SELECT *
      FROM categories
      WHERE id = ?
        AND deleted_at IS NULL
      LIMIT 1
    `,
    [categoryId]
  );

  const existing = existingRows[0];

  if (!existing) {
    throw new AppError(404, 'Category not found.');
  }

  if (
    (payload.name && payload.name !== existing.name) ||
    (payload.slug && payload.slug !== existing.slug)
  ) {
    const duplicate = await query(
      `
        SELECT id
        FROM categories
        WHERE deleted_at IS NULL
          AND id <> ?
          AND (name = ? OR slug = ?)
        LIMIT 1
      `,
      [categoryId, payload.name || existing.name, payload.slug || existing.slug]
    );

    if (duplicate[0]) {
      throw new AppError(409, 'Category name or slug already exists.');
    }
  }

  await query(
    `
      UPDATE categories
      SET name = ?,
          slug = ?,
          is_active = ?,
          updated_at = NOW()
      WHERE id = ?
    `,
    [
      payload.name ?? existing.name,
      payload.slug ?? existing.slug,
      payload.isActive !== undefined ? (payload.isActive ? 1 : 0) : existing.is_active,
      categoryId,
    ]
  );

  return { categoryId: Number(categoryId) };
}

async function deleteCategory(categoryId) {
  const existingRows = await query(
    `
      SELECT id
      FROM categories
      WHERE id = ?
        AND deleted_at IS NULL
      LIMIT 1
    `,
    [categoryId]
  );

  if (!existingRows[0]) {
    throw new AppError(404, 'Category not found.');
  }

  await query(
    `
      UPDATE categories
      SET deleted_at = NOW(),
          is_active = 0
      WHERE id = ?
    `,
    [categoryId]
  );

  return { categoryId: Number(categoryId) };
}

module.exports = {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};