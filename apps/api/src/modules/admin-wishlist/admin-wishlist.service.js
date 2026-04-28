const { query } = require('../../config/db');

async function listWishlistInsights(filters) {
  const conditions = ['wi.deleted_at IS NULL'];
  const params = [];

  if (filters.search) {
    conditions.push('(p.name LIKE ? OR u.email LIKE ? OR CONCAT(u.first_name, " ", u.last_name) LIKE ?)');
    const term = `%${filters.search}%`;
    params.push(term, term, term);
  }

  const rows = await query(
    `
      SELECT
        wi.id,
        wi.created_at AS createdAt,
        p.id AS productId,
        p.name AS productName,
        p.slug AS productSlug,
        (
          SELECT pi.file_url
          FROM product_images pi
          WHERE pi.product_id = p.id
            AND pi.deleted_at IS NULL
            AND COALESCE(pi.media_type, 'image') = 'image'
          ORDER BY pi.is_primary DESC, pi.sort_order ASC, pi.id ASC
          LIMIT 1
        ) AS primaryImage,
        CONCAT(u.first_name, ' ', u.last_name) AS customerName,
        u.email AS customerEmail,
        u.phone AS customerPhone
      FROM wishlist_items wi
      INNER JOIN products p
        ON p.id = wi.product_id
      INNER JOIN users u
        ON u.id = wi.user_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY wi.created_at DESC
    `,
    params
  );

  return rows.map((row) => ({
    id: row.id,
    createdAt: row.createdAt,
    product: {
      id: row.productId,
      name: row.productName,
      slug: row.productSlug,
      primaryImage: row.primaryImage,
    },
    customerName: row.customerName,
    customerEmail: row.customerEmail,
    customerPhone: row.customerPhone,
  }));
}

module.exports = {
  listWishlistInsights,
};
