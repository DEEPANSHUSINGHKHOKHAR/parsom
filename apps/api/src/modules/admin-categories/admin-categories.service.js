const { query } = require('../../config/db');
const AppError = require('../../utils/app-error');

const AUDIENCES = new Set(['women', 'men', 'kids']);
const BADGES = new Set(['', 'new', 'soon']);
let schemaReady = false;

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function columnExists(columnName) {
  const rows = await query(
    `
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'categories'
        AND COLUMN_NAME = ?
      LIMIT 1
    `,
    [columnName]
  );

  return Boolean(rows[0]);
}

async function indexExists(indexName) {
  const rows = await query(
    `
      SELECT INDEX_NAME
      FROM INFORMATION_SCHEMA.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'categories'
        AND INDEX_NAME = ?
      LIMIT 1
    `,
    [indexName]
  );

  return Boolean(rows[0]);
}

async function ensureCategorySchema() {
  if (schemaReady) return;

  if (!(await columnExists('audience'))) {
    await query("ALTER TABLE categories ADD COLUMN audience VARCHAR(20) NOT NULL DEFAULT 'women' AFTER slug");
  }

  if (!(await columnExists('parent_id'))) {
    await query('ALTER TABLE categories ADD COLUMN parent_id BIGINT UNSIGNED DEFAULT NULL AFTER audience');
  }

  if (!(await columnExists('badge'))) {
    await query("ALTER TABLE categories ADD COLUMN badge VARCHAR(20) NOT NULL DEFAULT '' AFTER parent_id");
  }

  if (await indexExists('uniq_categories_name')) {
    await query('ALTER TABLE categories DROP INDEX uniq_categories_name');
  }

  if (!(await indexExists('idx_categories_parent_id'))) {
    await query('ALTER TABLE categories ADD INDEX idx_categories_parent_id (parent_id)');
  }

  if (!(await indexExists('idx_categories_audience'))) {
    await query('ALTER TABLE categories ADD INDEX idx_categories_audience (audience)');
  }

  schemaReady = true;
}

function normalizePayload(payload, existing = {}) {
  const name = payload.name !== undefined ? String(payload.name).trim() : existing.name;
  const audience = payload.audience !== undefined ? payload.audience : (existing.audience || 'women');
  const badge = payload.badge !== undefined ? payload.badge : (existing.badge || '');
  const parentId = payload.parentId !== undefined
    ? (payload.parentId ? Number(payload.parentId) : null)
    : (existing.parent_id ? Number(existing.parent_id) : null);

  if (!name) {
    throw new AppError(422, 'Category name is required.');
  }

  if (!AUDIENCES.has(audience)) {
    throw new AppError(422, 'Choose Women, Men, or Kids.');
  }

  if (!BADGES.has(badge)) {
    throw new AppError(422, 'Badge must be None, New, or Soon.');
  }

  return { name, audience, badge, parentId };
}

async function getParentCategory(parentId, audience, excludeCategoryId = null) {
  if (!parentId) return null;

  const rows = await query(
    `
      SELECT id, name, slug, audience, parent_id
      FROM categories
      WHERE id = ?
        AND deleted_at IS NULL
      LIMIT 1
    `,
    [parentId]
  );

  const parent = rows[0];

  if (!parent) {
    throw new AppError(422, 'Parent category was not found.');
  }

  if (Number(parent.parent_id || 0) !== 0) {
    throw new AppError(422, 'Choose a main category as the parent.');
  }

  if (parent.audience !== audience) {
    throw new AppError(422, 'Parent category must use the same audience.');
  }

  if (excludeCategoryId && Number(parent.id) === Number(excludeCategoryId)) {
    throw new AppError(422, 'A category cannot be its own parent.');
  }

  return parent;
}

async function makeUniqueSlug({ name, audience, parent }) {
  const parts = [audience, parent?.slug, name].filter(Boolean);
  const baseSlug = slugify(parts.join(' ')) || 'category';
  let slug = baseSlug;
  let suffix = 2;

  while (true) {
    const rows = await query(
      `
        SELECT id
        FROM categories
        WHERE slug = ?
          AND deleted_at IS NULL
        LIMIT 1
      `,
      [slug]
    );

    if (!rows[0]) return slug;

    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
}

async function listCategories() {
  await ensureCategorySchema();

  const rows = await query(
    `
      SELECT
        c.id,
        c.name,
        c.slug,
        c.audience,
        c.parent_id AS parentId,
        p.name AS parentName,
        c.badge,
        c.is_active AS isActive,
        c.created_at AS createdAt
      FROM categories c
      LEFT JOIN categories p
        ON p.id = c.parent_id
      WHERE c.deleted_at IS NULL
      ORDER BY c.audience ASC, COALESCE(p.name, c.name) ASC, c.parent_id IS NULL DESC, c.name ASC
    `
  );

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    audience: row.audience || 'women',
    parentId: row.parentId ? Number(row.parentId) : null,
    parentName: row.parentName || '',
    badge: row.badge || '',
    isActive: Boolean(row.isActive),
    createdAt: row.createdAt,
  }));
}

async function createCategory(payload) {
  await ensureCategorySchema();

  const normalized = normalizePayload(payload);
  const parent = await getParentCategory(normalized.parentId, normalized.audience);
  const slug = await makeUniqueSlug({
    name: normalized.name,
    audience: normalized.audience,
    parent,
  });

  const existing = await query(
    `
      SELECT id
      FROM categories
      WHERE deleted_at IS NULL
        AND name = ?
        AND audience = ?
        AND parent_id <=> ?
      LIMIT 1
    `,
    [normalized.name, normalized.audience, normalized.parentId]
  );

  if (existing[0]) {
    throw new AppError(409, 'Category already exists for this audience and parent.');
  }

  const result = await query(
    `
      INSERT INTO categories (name, slug, audience, parent_id, badge, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    [
      normalized.name,
      slug,
      normalized.audience,
      normalized.parentId,
      normalized.badge,
      payload.isActive === false ? 0 : 1,
    ]
  );

  return { categoryId: result.insertId, slug };
}

async function updateCategory(categoryId, payload) {
  await ensureCategorySchema();

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

  const normalized = normalizePayload(payload, existing);
  const parent = await getParentCategory(normalized.parentId, normalized.audience, categoryId);

  if (
    normalized.name !== existing.name ||
    normalized.audience !== existing.audience ||
    normalized.parentId !== (existing.parent_id ? Number(existing.parent_id) : null)
  ) {
    const duplicate = await query(
      `
        SELECT id
        FROM categories
        WHERE deleted_at IS NULL
          AND id <> ?
          AND name = ?
          AND audience = ?
          AND parent_id <=> ?
        LIMIT 1
      `,
      [categoryId, normalized.name, normalized.audience, normalized.parentId]
    );

    if (duplicate[0]) {
      throw new AppError(409, 'Category already exists for this audience and parent.');
    }
  }

  const shouldRegenerateSlug =
    normalized.name !== existing.name ||
    normalized.audience !== existing.audience ||
    normalized.parentId !== (existing.parent_id ? Number(existing.parent_id) : null);
  const nextSlug = shouldRegenerateSlug
    ? await makeUniqueSlug({
        name: normalized.name,
        audience: normalized.audience,
        parent,
      })
    : existing.slug;

  await query(
    `
      UPDATE categories
      SET name = ?,
          slug = ?,
          audience = ?,
          parent_id = ?,
          badge = ?,
          is_active = ?,
          updated_at = NOW()
      WHERE id = ?
    `,
    [
      normalized.name,
      nextSlug,
      normalized.audience,
      normalized.parentId,
      normalized.badge,
      payload.isActive !== undefined ? (payload.isActive ? 1 : 0) : existing.is_active,
      categoryId,
    ]
  );

  return { categoryId: Number(categoryId), slug: nextSlug };
}

async function deleteCategory(categoryId) {
  await ensureCategorySchema();

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
