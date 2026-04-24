const { query } = require('../../config/db');
const AppError = require('../../utils/app-error');

function getSortClause(sort) {
  switch (sort) {
    case 'price_low_to_high':
      return 'effective_price ASC, p.created_at DESC';
    case 'price_high_to_low':
      return 'effective_price DESC, p.created_at DESC';
    case 'average':
      return 'avg_rating DESC, p.created_at DESC';
    case 'latest':
    default:
      return 'p.created_at DESC';
  }
}

async function listProducts(filters) {
  const conditions = ['p.deleted_at IS NULL', 'p.is_active = 1'];
  const params = [];

  if (filters.search) {
    conditions.push('(p.name LIKE ? OR p.short_description LIKE ? OR p.description LIKE ?)');
    const term = `%${filters.search}%`;
    params.push(term, term, term);
  }

  if (filters.category) {
    conditions.push('c.slug = ?');
    params.push(filters.category);
  }

  if (filters.availability === 'in_stock') {
    conditions.push('p.coming_soon_flag = 0');
    conditions.push('COALESCE(stock.available_stock, 0) > 0');
  }

  if (filters.availability === 'out_of_stock') {
    conditions.push('p.coming_soon_flag = 0');
    conditions.push('COALESCE(stock.available_stock, 0) <= 0');
  }

  if (filters.availability === 'coming_soon') {
    conditions.push('p.coming_soon_flag = 1');
  }

  const sql = `
    SELECT
      p.id,
      p.slug,
      p.name,
      p.short_description AS shortDescription,
      c.name AS categoryName,
      p.original_price AS originalPrice,
      p.discount_price AS discountPrice,
      COALESCE(p.discount_price, p.original_price) AS effective_price,
      CASE WHEN p.coming_soon_flag = 1 THEN 'coming_soon' WHEN p.is_active = 1 THEN 'active' ELSE 'inactive' END AS status,
      p.featured_flag AS isFeatured,
      p.trending_flag AS isTrending,
      p.coming_soon_flag AS isComingSoon,
      COALESCE(stock.available_stock, 0) AS availableStock,
      media.primary_image AS primaryImage,
      media.secondary_image AS secondaryImage,
      COALESCE(avg_reviews.avg_rating, 0) AS avg_rating
    FROM products p
    LEFT JOIN categories c
      ON c.id = p.category_id
      AND c.deleted_at IS NULL
    LEFT JOIN (
      SELECT
        product_id,
        MAX(CASE WHEN is_primary = 1 AND media_type = 'image' THEN file_url END) AS primary_image,
        MAX(CASE WHEN is_secondary = 1 AND media_type = 'image' THEN file_url END) AS secondary_image
      FROM product_images
      WHERE deleted_at IS NULL
      GROUP BY product_id
    ) media ON media.product_id = p.id
    LEFT JOIN (
      SELECT
        pv.product_id,
        SUM(GREATEST(stock_qty - reserved_qty, 0)) AS available_stock
      FROM size_stock
      INNER JOIN product_variants pv
        ON pv.id = size_stock.product_variant_id
      WHERE pv.deleted_at IS NULL
        AND pv.is_active = 1
      GROUP BY pv.product_id
    ) stock ON stock.product_id = p.id
    LEFT JOIN (
      SELECT
        product_id,
        AVG(rating) AS avg_rating
      FROM reviews
      WHERE deleted_at IS NULL
        AND review_status = 'approved'
      GROUP BY product_id
    ) avg_reviews ON avg_reviews.product_id = p.id
    WHERE ${conditions.join(' AND ')}
    ORDER BY ${getSortClause(filters.sort)}
  `;

  const rows = await query(sql, params);

  const items = rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    shortDescription: row.shortDescription,
    categoryName: row.categoryName,
    price: Number(row.effective_price),
    discountPrice: row.discountPrice !== null ? Number(row.discountPrice) : null,
    originalPrice: Number(row.originalPrice),
    primaryImage: row.primaryImage,
    secondaryImage: row.secondaryImage,
    status: row.status,
    isFeatured: Boolean(row.isFeatured),
    isTrending: Boolean(row.isTrending),
    isComingSoon: Boolean(row.isComingSoon),
    availableStock: Number(row.availableStock)
  }));

  const categories = await query(
    `
      SELECT id, name, slug
      FROM categories
      WHERE deleted_at IS NULL
        AND is_active = 1
      ORDER BY name ASC
    `
  );

  return {
    items,
    filters: {
      categories: categories.map((category) => ({
        value: category.slug,
        label: category.name
      }))
    }
  };
}

async function getProductBySlug(slug) {
  const rows = await query(
    `
      SELECT
        p.id,
        p.category_id AS categoryId,
        p.slug,
        p.name,
        p.short_description AS shortDescription,
        p.description,
        NULL AS materialDetails,
        NULL AS careDetails,
        NULL AS shippingNotes,
        p.original_price AS originalPrice,
        p.discount_price AS discountPrice,
        COALESCE(p.discount_price, p.original_price) AS effectivePrice,
        CASE WHEN p.coming_soon_flag = 1 THEN 'coming_soon' WHEN p.is_active = 1 THEN 'active' ELSE 'inactive' END AS status,
        c.name AS categoryName,
        media.primary_image AS primaryImage
      FROM products p
      LEFT JOIN categories c
        ON c.id = p.category_id
        AND c.deleted_at IS NULL
      LEFT JOIN (
        SELECT
          product_id,
          MAX(CASE WHEN is_primary = 1 AND media_type = 'image' THEN file_url END) AS primary_image
        FROM product_images
        WHERE deleted_at IS NULL
        GROUP BY product_id
      ) media ON media.product_id = p.id
      WHERE p.slug = ?
        AND p.deleted_at IS NULL
        AND p.is_active = 1
      LIMIT 1
    `,
    [slug]
  );

  const product = rows[0];

  if (!product) {
    throw new AppError(404, 'Product not found.');
  }

  const media = await query(
    `
      SELECT
        file_url AS url,
        media_type AS type,
        alt_text AS alt
      FROM product_images
      WHERE product_id = ?
        AND deleted_at IS NULL
      ORDER BY sort_order ASC, id ASC
    `,
    [product.id]
  );

  const sizes = await query(
    `
      SELECT
        pv.size_code AS size,
        GREATEST(stock_qty - reserved_qty, 0) AS stock,
        CASE
          WHEN GREATEST(stock_qty - reserved_qty, 0) > 0 THEN 'in_stock'
          ELSE 'out_of_stock'
        END AS status
      FROM product_variants pv
      INNER JOIN size_stock ss
        ON ss.product_variant_id = pv.id
      WHERE pv.product_id = ?
        AND pv.deleted_at IS NULL
        AND pv.is_active = 1
      ORDER BY FIELD(pv.size_code, 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'), pv.id ASC
    `,
    [product.id]
  );

  const reviews = await query(
    `
      SELECT
        r.id,
        r.rating,
        r.comment,
        CONCAT(u.first_name, ' ', u.last_name) AS userName,
        r.image_path AS imageUrl,
        r.created_at AS createdAt
      FROM reviews r
      INNER JOIN users u
        ON u.id = r.user_id
      WHERE r.product_id = ?
        AND r.deleted_at IS NULL
        AND r.review_status = 'approved'
      ORDER BY r.created_at DESC
    `,
    [product.id]
  );

  const relatedRows = await query(
    `
      SELECT
        p.id,
        p.slug,
        p.name,
        p.short_description AS shortDescription,
        c.name AS categoryName,
        p.original_price AS originalPrice,
        p.discount_price AS discountPrice,
        COALESCE(p.discount_price, p.original_price) AS effective_price,
        CASE WHEN p.coming_soon_flag = 1 THEN 'coming_soon' WHEN p.is_active = 1 THEN 'active' ELSE 'inactive' END AS status,
        p.featured_flag AS isFeatured,
        p.trending_flag AS isTrending,
        p.coming_soon_flag AS isComingSoon,
        media.primary_image AS primaryImage,
        media.secondary_image AS secondaryImage
      FROM products p
      LEFT JOIN categories c
        ON c.id = p.category_id
        AND c.deleted_at IS NULL
      LEFT JOIN (
        SELECT
          product_id,
          MAX(CASE WHEN is_primary = 1 AND media_type = 'image' THEN file_url END) AS primary_image,
          MAX(CASE WHEN is_secondary = 1 AND media_type = 'image' THEN file_url END) AS secondary_image
        FROM product_images
        WHERE deleted_at IS NULL
        GROUP BY product_id
      ) media ON media.product_id = p.id
      WHERE p.deleted_at IS NULL
        AND p.is_active = 1
        AND p.id <> ?
        AND p.category_id <=> ?
      ORDER BY p.created_at DESC
      LIMIT 4
    `,
    [product.id, product.categoryId]
  );

  return {
    item: {
      id: product.id,
      slug: product.slug,
      name: product.name,
      shortDescription: product.shortDescription,
      description: product.description,
      materialDetails: product.materialDetails,
      careDetails: product.careDetails,
      shippingNotes: product.shippingNotes,
      categoryName: product.categoryName,
      price: Number(product.effectivePrice),
      discountPrice: product.discountPrice !== null ? Number(product.discountPrice) : null,
      originalPrice: Number(product.originalPrice),
      primaryImage: product.primaryImage,
      status: product.status,
      media,
      sizes: sizes.map((size) => ({
        size: size.size,
        stock: Number(size.stock),
        status: size.status
      })),
      reviews: reviews.map((review) => ({
        id: review.id,
        rating: Number(review.rating),
        comment: review.comment,
        userName: review.userName,
        imageUrl: review.imageUrl,
        createdAt: review.createdAt
      }))
    },
    relatedItems: relatedRows.map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      shortDescription: row.shortDescription,
      categoryName: row.categoryName,
      price: Number(row.effective_price),
      discountPrice: row.discountPrice !== null ? Number(row.discountPrice) : null,
      originalPrice: Number(row.originalPrice),
      primaryImage: row.primaryImage,
      secondaryImage: row.secondaryImage,
      status: row.status,
      isFeatured: Boolean(row.isFeatured),
      isTrending: Boolean(row.isTrending),
      isComingSoon: Boolean(row.isComingSoon)
    }))
  };
}

module.exports = {
  listProducts,
  getProductBySlug
};
