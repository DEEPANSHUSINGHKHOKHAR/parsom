const { query } = require('../../config/db');
const AppError = require('../../utils/app-error');

async function addWishlistItem(productId, actor) {
  const productRows = await query(
    `
      SELECT id
      FROM products
      WHERE id = ?
        AND deleted_at IS NULL
        AND is_active = 1
      LIMIT 1
    `,
    [productId]
  );

  if (!productRows[0]) {
    throw new AppError(404, 'Product not found.');
  }

  const existingRows = await query(
    `
      SELECT id
      FROM wishlist_items
      WHERE user_id = ?
        AND product_id = ?
        AND deleted_at IS NULL
      LIMIT 1
    `,
    [actor.id, productId]
  );

  if (existingRows[0]) {
    return {
      wishlistItemId: existingRows[0].id,
      productId: Number(productId),
    };
  }

  const result = await query(
    `
      INSERT INTO wishlist_items (user_id, product_id)
      VALUES (?, ?)
    `,
    [actor.id, productId]
  );

  return {
    wishlistItemId: result.insertId,
    productId: Number(productId),
  };
}

async function getMyWishlist(actor) {
  const rows = await query(
    `
      SELECT
        wi.id,
        wi.created_at AS createdAt,
        p.id AS productId,
        p.name AS productName,
        p.slug AS productSlug,
        CASE WHEN p.coming_soon_flag = 1 THEN 'coming_soon' WHEN p.is_active = 1 THEN 'active' ELSE 'inactive' END AS status,
        p.original_price AS originalPrice,
        p.discount_price AS discountPrice,
        COALESCE(p.discount_price, p.original_price) AS effectivePrice,
        c.name AS categoryName,
        (
          SELECT pi.file_url
          FROM product_images pi
          WHERE pi.product_id = p.id
            AND pi.deleted_at IS NULL
            AND COALESCE(pi.media_type, 'image') = 'image'
          ORDER BY pi.is_primary DESC, pi.sort_order ASC, pi.id ASC
          LIMIT 1
        ) AS primaryImage
      FROM wishlist_items wi
      INNER JOIN products p
        ON p.id = wi.product_id
      LEFT JOIN categories c
        ON c.id = p.category_id
      WHERE wi.user_id = ?
        AND wi.deleted_at IS NULL
        AND p.deleted_at IS NULL
      ORDER BY wi.created_at DESC
    `,
    [actor.id]
  );

  return rows.map((row) => ({
    id: row.id,
    createdAt: row.createdAt,
    product: {
      id: row.productId,
      name: row.productName,
      slug: row.productSlug,
      status: row.status,
      price: Number(row.effectivePrice),
      discountPrice: row.discountPrice !== null ? Number(row.discountPrice) : null,
      originalPrice: Number(row.originalPrice),
      categoryName: row.categoryName,
      primaryImage: row.primaryImage,
    },
  }));
}

async function removeWishlistItem(productId, actor) {
  const existingRows = await query(
    `
      SELECT id
      FROM wishlist_items
      WHERE user_id = ?
        AND product_id = ?
        AND deleted_at IS NULL
      LIMIT 1
    `,
    [actor.id, productId]
  );

  if (!existingRows[0]) {
    throw new AppError(404, 'Wishlist item not found.');
  }

  await query(
    `
      UPDATE wishlist_items
      SET deleted_at = NOW()
      WHERE id = ?
    `,
    [existingRows[0].id]
  );

  return {
    productId: Number(productId),
  };
}

module.exports = {
  addWishlistItem,
  getMyWishlist,
  removeWishlistItem,
};
