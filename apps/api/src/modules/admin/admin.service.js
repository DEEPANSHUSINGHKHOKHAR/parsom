const { pool, query } = require('../../config/db');
const AppError = require('../../utils/app-error');
const { refundRazorpayPayment } = require('../../utils/razorpay');
const { ensureStoreSchema } = require('../../utils/store-schema');
const {
  VELOCITY_BANNER_KEY,
  parseBannerEntries,
} = require('../storefront/storefront.service');

function productStatus(row) {
  if (Number(row.coming_soon_flag) === 1) return 'coming_soon';
  return Number(row.is_active) === 1 ? 'active' : 'inactive';
}

function productFlagsFromStatus(status, isActive = true) {
  return {
    isActive: status ? status !== 'inactive' : isActive,
    isComingSoon: status === 'coming_soon',
  };
}

function normalizeMoney(value) {
  if (value === '' || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function calculateGatewayCharge(baseSellingPrice) {
  const gatewayBase = Number(baseSellingPrice || 0) * 0.02;
  const gstOnGateway = gatewayBase * 0.18;
  return Number((gatewayBase + gstOnGateway).toFixed(2));
}

function calculatePricingFields(payload = {}, fallback = {}) {
  const makingPrice = normalizeMoney(payload.makingPrice ?? fallback.makingPrice);
  const deliveryPrice = normalizeMoney(payload.deliveryPrice ?? fallback.deliveryPrice) || 0;
  const packingPrice = normalizeMoney(payload.packingPrice ?? fallback.packingPrice) || 0;
  const profitMargin = normalizeMoney(payload.profitMargin ?? fallback.profitMargin) || 0;
  const fallbackOriginalPrice = normalizeMoney(fallback.originalPrice);
  const fallbackDiscountPrice = normalizeMoney(fallback.discountPrice);
  const sellingPrice =
    normalizeMoney(payload.sellingPrice ?? fallback.sellingPrice) ??
    (makingPrice !== null
      ? Number(((makingPrice || 0) + deliveryPrice + packingPrice + profitMargin).toFixed(2))
      : fallbackDiscountPrice ?? fallbackOriginalPrice ?? 0);
  const paymentGatewayPrice =
    normalizeMoney(payload.paymentGatewayPrice ?? fallback.paymentGatewayPrice) ??
    calculateGatewayCharge(sellingPrice);
  const finalSellingPrice =
    normalizeMoney(payload.finalSellingPrice ?? fallback.finalSellingPrice) ??
    (fallbackDiscountPrice ?? Number((sellingPrice + paymentGatewayPrice).toFixed(2)));
  const roundedSellingPrice =
    normalizeMoney(payload.roundedSellingPrice ?? fallback.roundedSellingPrice);
  const effectiveSellingPrice = roundedSellingPrice ?? finalSellingPrice;
  const mrpMode = ['amount', 'percentage'].includes(payload.mrpMode)
    ? payload.mrpMode
    : fallback.mrpMode || 'amount';
  const mrpValue = normalizeMoney(payload.mrpValue ?? fallback.mrpValue);
  const price = mrpMode === 'percentage' && mrpValue !== null
    ? Number((effectiveSellingPrice * (1 + mrpValue / 100)).toFixed(2))
    : mrpValue ?? effectiveSellingPrice;

  return {
    makingPrice,
    deliveryPrice,
    packingPrice,
    profitMargin,
    sellingPrice,
    paymentGatewayPrice,
    finalSellingPrice,
    roundedSellingPrice,
    effectiveSellingPrice,
    mrpMode,
    mrpValue,
    originalPrice: price,
    discountPrice: effectiveSellingPrice,
  };
}

function normalizeSizeMode(value) {
  return ['stock', 'notify', 'hidden'].includes(value) ? value : 'stock';
}

function splitCustomerName(name = '') {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' '),
  };
}

function parseAddressSnapshot(snapshot) {
  if (!snapshot) return {};
  if (typeof snapshot === 'object') return snapshot;

  try {
    return JSON.parse(snapshot);
  } catch {
    return {};
  }
}

function slugifyProductName(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 220);
}

async function productSlugExists(connection, slug, excludeProductId = null) {
  const sql = excludeProductId
    ? `
      SELECT id
      FROM products
      WHERE slug = ?
        AND deleted_at IS NULL
        AND id <> ?
      LIMIT 1
    `
    : `
      SELECT id
      FROM products
      WHERE slug = ?
        AND deleted_at IS NULL
      LIMIT 1
    `;

  const params = excludeProductId ? [slug, excludeProductId] : [slug];
  const [rows] = await connection.execute(sql, params);
  return Boolean(rows[0]);
}

async function generateUniqueProductSlug(connection, value, excludeProductId = null) {
  const baseSlug = slugifyProductName(value) || 'product';
  let candidate = baseSlug;
  let suffix = 2;

  while (await productSlugExists(connection, candidate, excludeProductId)) {
    const suffixText = `-${suffix}`;
    candidate = `${baseSlug.slice(0, 220 - suffixText.length)}${suffixText}`;
    suffix += 1;
  }

  return candidate;
}

async function ensureUniqueProductSlug(connection, slug, excludeProductId = null) {
  const sql = excludeProductId
    ? `
      SELECT id
      FROM products
      WHERE slug = ?
        AND deleted_at IS NULL
        AND id <> ?
      LIMIT 1
    `
    : `
      SELECT id
      FROM products
      WHERE slug = ?
        AND deleted_at IS NULL
      LIMIT 1
    `;

  const params = excludeProductId ? [slug, excludeProductId] : [slug];
  const [rows] = await connection.execute(sql, params);

  if (rows[0]) {
    throw new AppError(409, 'Product slug already exists.');
  }
}

async function tableExists(connection, tableName) {
  const [rows] = await connection.execute(
    `
      SELECT TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
      LIMIT 1
    `,
    [tableName]
  );

  return Boolean(rows[0]);
}

async function columnExists(connection, tableName, columnName) {
  const [rows] = await connection.execute(
    `
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
        AND COLUMN_NAME = ?
      LIMIT 1
    `,
    [tableName, columnName]
  );

  return Boolean(rows[0]);
}

async function deleteWhereProductId(connection, tableName, productId) {
  if (!(await tableExists(connection, tableName))) {
    return;
  }

  if (!(await columnExists(connection, tableName, 'product_id'))) {
    return;
  }

  await connection.execute(`DELETE FROM ${tableName} WHERE product_id = ?`, [productId]);
}

async function deleteWhereProductVariantId(connection, tableName, productId) {
  if (!(await tableExists(connection, tableName))) {
    return;
  }

  if (!(await columnExists(connection, tableName, 'product_variant_id'))) {
    return;
  }

  await connection.execute(
    `
      DELETE FROM ${tableName}
      WHERE product_variant_id IN (
        SELECT id
        FROM (
          SELECT id
          FROM product_variants
          WHERE product_id = ?
        ) product_variant_scope
      )
    `,
    [productId]
  );
}

async function replaceProductImages(connection, productId, images = []) {
  await connection.execute(
    `
      UPDATE product_images
      SET deleted_at = NOW()
      WHERE product_id = ?
        AND deleted_at IS NULL
    `,
    [productId]
  );

  for (const image of images) {
    await connection.execute(
      `
        INSERT INTO product_images (
          product_id,
          media_type,
          file_url,
          alt_text,
          is_primary,
          is_secondary,
          sort_order
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        productId,
        image.type || 'image',
        image.url,
        image.alt || null,
        image.isPrimary ? 1 : 0,
        image.isSecondary ? 1 : 0,
        image.sortOrder || 0,
      ]
    );
  }
}

async function replaceProductSizes(connection, productId, sizes = [], skuPrefix = 'PSM') {
  const activeSizes = sizes
    .filter((item) => item.size)
    .map((item) => String(item.size).trim().toUpperCase());

  if (activeSizes.length > 0) {
    await connection.execute(
      `
        UPDATE product_variants
        SET is_active = 0,
            deleted_at = NOW()
        WHERE product_id = ?
          AND deleted_at IS NULL
          AND size_code NOT IN (${activeSizes.map(() => '?').join(', ')})
      `,
      [productId, ...activeSizes]
    );
  } else {
    await connection.execute(
      `
        UPDATE product_variants
        SET is_active = 0,
            deleted_at = NOW()
        WHERE product_id = ?
          AND deleted_at IS NULL
      `,
      [productId]
    );
  }

  for (const sizeItem of sizes) {
    const sizeCode = String(sizeItem.size || '').trim().toUpperCase();
    if (!sizeCode) continue;
    const sizeMode = normalizeSizeMode(sizeItem.mode);
    const isVisible = sizeMode !== 'hidden' && sizeItem.isActive !== false;
    const notifyOnly = sizeMode === 'notify';
    const stockQty = notifyOnly ? 0 : Number(sizeItem.stockQty || 0);
    const lowStockThreshold = notifyOnly ? 0 : Number(sizeItem.lowStockThreshold || 5);

    const [variantRows] = await connection.execute(
      `
        SELECT id
        FROM product_variants
        WHERE product_id = ?
          AND size_code = ?
        LIMIT 1
      `,
      [productId, sizeCode]
    );

    let variantId = variantRows[0]?.id;
    const sku = `${skuPrefix || `PSM-${productId}`}-${sizeCode}`;

    if (variantId) {
      await connection.execute(
        `
          UPDATE product_variants
          SET sku = ?,
              is_active = ?,
              notify_only = ?,
              deleted_at = NULL,
              updated_at = NOW()
          WHERE id = ?
        `,
        [sku, isVisible ? 1 : 0, notifyOnly ? 1 : 0, variantId]
      );
    } else {
      const [insertResult] = await connection.execute(
        `
          INSERT INTO product_variants (product_id, size_code, sku, is_active, notify_only)
          VALUES (?, ?, ?, ?, ?)
        `,
        [productId, sizeCode, sku, isVisible ? 1 : 0, notifyOnly ? 1 : 0]
      );
      variantId = insertResult.insertId;
    }

    const stockStatus =
      notifyOnly || stockQty <= 0
        ? 'out_of_stock'
        : stockQty <= lowStockThreshold
          ? 'low_stock'
          : 'in_stock';

    const [stockRows] = await connection.execute(
      'SELECT id FROM size_stock WHERE product_variant_id = ? LIMIT 1',
      [variantId]
    );

    if (stockRows[0]) {
      await connection.execute(
        `
          UPDATE size_stock
          SET stock_qty = ?,
              reserved_qty = ?,
              low_stock_threshold = ?,
              stock_status = ?
          WHERE product_variant_id = ?
        `,
        [
          stockQty,
          Number(sizeItem.reservedQty || 0),
          lowStockThreshold,
          stockStatus,
          variantId,
        ]
      );
    } else {
      await connection.execute(
        `
          INSERT INTO size_stock (
            product_variant_id,
            stock_qty,
            reserved_qty,
            low_stock_threshold,
            stock_status
          )
          VALUES (?, ?, ?, ?, ?)
        `,
        [
          variantId,
          stockQty,
          Number(sizeItem.reservedQty || 0),
          lowStockThreshold,
          stockStatus,
        ]
      );
    }
  }
}

async function listAdminProducts(filters) {
  await ensureStoreSchema();

  const conditions = ['p.deleted_at IS NULL'];
  const params = [];

  if (filters.search) {
    conditions.push('(p.name LIKE ? OR p.slug LIKE ?)');
    const term = `%${filters.search}%`;
    params.push(term, term);
  }

  if (filters.status === 'active') {
    conditions.push('p.is_active = 1 AND p.coming_soon_flag = 0');
  } else if (filters.status === 'inactive') {
    conditions.push('p.is_active = 0');
  } else if (filters.status === 'coming_soon') {
    conditions.push('p.coming_soon_flag = 1');
  }

  if (filters.categoryId) {
    conditions.push('p.category_id = ?');
    params.push(filters.categoryId);
  }

  const rows = await query(
    `
      SELECT
        p.id,
        p.name,
        p.slug,
        COALESCE(
          CASE
            WHEN p.mrp_mode = 'percentage' AND p.mrp_value IS NOT NULL
              THEN ROUND(
                COALESCE(p.rounded_selling_price, p.final_selling_price, p.discount_price, p.original_price)
                * (1 + (p.mrp_value / 100)),
                2
              )
            ELSE p.mrp_value
          END,
          p.original_price
        ) AS price,
        COALESCE(
          p.rounded_selling_price,
          p.final_selling_price,
          p.discount_price,
          p.original_price
        ) AS discountPrice,
        p.cost_price AS costPrice,
        p.making_price AS makingPrice,
        p.delivery_price AS deliveryPrice,
        p.packing_price AS packingPrice,
        p.profit_margin AS profitMargin,
        p.payment_gateway_price AS paymentGatewayPrice,
        p.selling_price AS sellingPrice,
        p.final_selling_price AS finalSellingPrice,
        p.rounded_selling_price AS roundedSellingPrice,
        p.mrp_mode AS mrpMode,
        p.mrp_value AS mrpValue,
        p.is_active,
        p.featured_flag AS isFeatured,
        p.trending_flag AS isTrending,
        p.coming_soon_flag,
        p.created_at AS createdAt,
        c.name AS categoryName,
        (
          SELECT file_url
          FROM product_images pi
          WHERE pi.product_id = p.id
            AND pi.deleted_at IS NULL
            AND pi.is_primary = 1
          ORDER BY pi.sort_order ASC, pi.id ASC
          LIMIT 1
        ) AS primaryImage,
        (
          SELECT media_type
          FROM product_images pi
          WHERE pi.product_id = p.id
            AND pi.deleted_at IS NULL
            AND pi.is_primary = 1
          ORDER BY pi.sort_order ASC, pi.id ASC
          LIMIT 1
        ) AS primaryMediaType,
        COALESCE(stock.availableStock, 0) AS availableStock
      FROM products p
      LEFT JOIN categories c
        ON c.id = p.category_id
      LEFT JOIN (
        SELECT
          pv.product_id,
          SUM(GREATEST(ss.stock_qty - ss.reserved_qty, 0)) AS availableStock
        FROM product_variants pv
        INNER JOIN size_stock ss
          ON ss.product_variant_id = pv.id
        WHERE pv.deleted_at IS NULL
          AND pv.is_active = 1
        GROUP BY pv.product_id
      ) stock ON stock.product_id = p.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY p.created_at DESC
    `,
    params
  );

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    status: productStatus(row),
    price: Number(row.price),
    discountPrice: row.discountPrice !== null ? Number(row.discountPrice) : null,
    costPrice: row.costPrice !== null ? Number(row.costPrice) : null,
    makingPrice: row.makingPrice !== null ? Number(row.makingPrice) : null,
    deliveryPrice: row.deliveryPrice !== null ? Number(row.deliveryPrice) : null,
    packingPrice: row.packingPrice !== null ? Number(row.packingPrice) : null,
    profitMargin: row.profitMargin !== null ? Number(row.profitMargin) : null,
    paymentGatewayPrice: row.paymentGatewayPrice !== null ? Number(row.paymentGatewayPrice) : null,
    sellingPrice: row.sellingPrice !== null ? Number(row.sellingPrice) : null,
    finalSellingPrice: row.finalSellingPrice !== null ? Number(row.finalSellingPrice) : null,
    roundedSellingPrice: row.roundedSellingPrice !== null ? Number(row.roundedSellingPrice) : null,
    mrpMode: row.mrpMode || 'amount',
    mrpValue: row.mrpValue !== null ? Number(row.mrpValue) : null,
    isActive: Boolean(row.is_active),
    isFeatured: Boolean(row.isFeatured),
    isTrending: Boolean(row.isTrending),
    createdAt: row.createdAt,
    categoryName: row.categoryName,
    primaryImage: row.primaryImage,
    primaryMediaType: row.primaryMediaType || 'image',
    availableStock: Number(row.availableStock || 0),
  }));
}

async function getAdminProductById(productId) {
  await ensureStoreSchema();

  const rows = await query(
    `
      SELECT
        p.*,
        c.name AS categoryName
      FROM products p
      LEFT JOIN categories c
        ON c.id = p.category_id
      WHERE p.id = ?
        AND p.deleted_at IS NULL
      LIMIT 1
    `,
    [productId]
  );

  const product = rows[0];

  if (!product) {
    throw new AppError(404, 'Product not found.');
  }

  const media = await query(
    `
      SELECT
        id,
        media_type AS type,
        file_url AS url,
        alt_text AS alt,
        is_primary AS isPrimary,
        is_secondary AS isSecondary,
        sort_order AS sortOrder
      FROM product_images
      WHERE product_id = ?
        AND deleted_at IS NULL
      ORDER BY sort_order ASC, id ASC
    `,
    [productId]
  );

  const sizes = await query(
    `
      SELECT
        pv.id,
        pv.size_code AS size,
        ss.stock_qty AS stockQty,
        ss.reserved_qty AS reservedQty,
        ss.low_stock_threshold AS lowStockThreshold,
        pv.is_active AS isActive,
        pv.notify_only AS notifyOnly
      FROM product_variants pv
      LEFT JOIN size_stock ss
        ON ss.product_variant_id = pv.id
      WHERE pv.product_id = ?
        AND pv.deleted_at IS NULL
      ORDER BY FIELD(pv.size_code, 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'), pv.id ASC
    `,
    [productId]
  );

  return {
    id: product.id,
    categoryId: product.category_id,
    categoryName: product.categoryName,
    name: product.name,
    slug: product.slug,
    shortDescription: product.short_description,
    description: product.description,
    materialDetails: '',
    careDetails: '',
    shippingNotes: '',
    price: Number(
      calculatePricingFields({}, {
        makingPrice: product.making_price,
        deliveryPrice: product.delivery_price,
        packingPrice: product.packing_price,
        profitMargin: product.profit_margin,
        paymentGatewayPrice: product.payment_gateway_price,
        sellingPrice: product.selling_price,
        finalSellingPrice: product.final_selling_price,
        roundedSellingPrice: product.rounded_selling_price,
        mrpMode: product.mrp_mode,
        mrpValue: product.mrp_value,
        originalPrice: product.original_price,
        discountPrice: product.discount_price,
      }).originalPrice
    ),
    discountPrice: Number(
      calculatePricingFields({}, {
        makingPrice: product.making_price,
        deliveryPrice: product.delivery_price,
        packingPrice: product.packing_price,
        profitMargin: product.profit_margin,
        paymentGatewayPrice: product.payment_gateway_price,
        sellingPrice: product.selling_price,
        finalSellingPrice: product.final_selling_price,
        roundedSellingPrice: product.rounded_selling_price,
        mrpMode: product.mrp_mode,
        mrpValue: product.mrp_value,
        originalPrice: product.original_price,
        discountPrice: product.discount_price,
      }).discountPrice
    ),
    costPrice: product.cost_price !== null ? Number(product.cost_price) : null,
    makingPrice: product.making_price !== null ? Number(product.making_price) : null,
    deliveryPrice: product.delivery_price !== null ? Number(product.delivery_price) : null,
    packingPrice: product.packing_price !== null ? Number(product.packing_price) : null,
    profitMargin: product.profit_margin !== null ? Number(product.profit_margin) : null,
    paymentGatewayPrice:
      product.payment_gateway_price !== null ? Number(product.payment_gateway_price) : null,
    sellingPrice: product.selling_price !== null ? Number(product.selling_price) : null,
    finalSellingPrice:
      product.final_selling_price !== null ? Number(product.final_selling_price) : null,
    roundedSellingPrice:
      product.rounded_selling_price !== null ? Number(product.rounded_selling_price) : null,
    mrpMode: product.mrp_mode || 'amount',
    mrpValue: product.mrp_value !== null ? Number(product.mrp_value) : null,
    status: productStatus(product),
    isActive: Boolean(product.is_active),
    isFeatured: Boolean(product.featured_flag),
    isTrending: Boolean(product.trending_flag),
    videoUrl: '',
    seoTitle: product.seo_title,
    seoDescription: product.seo_description,
    seoImage: '',
    sortOrder: 0,
    media: media.map((item) => ({
      id: item.id,
      type: item.type,
      url: item.url,
      alt: item.alt,
      isPrimary: Boolean(item.isPrimary),
      isSecondary: Boolean(item.isSecondary),
      sortOrder: Number(item.sortOrder),
    })),
    sizes: sizes.map((item) => ({
      id: item.id,
      size: item.size,
      stockQty: Number(item.stockQty || 0),
      reservedQty: Number(item.reservedQty || 0),
      lowStockThreshold: Number(item.lowStockThreshold || 5),
      isActive: Boolean(item.isActive),
      notifyOnly: Boolean(item.notifyOnly),
      mode: !item.isActive ? 'hidden' : item.notifyOnly ? 'notify' : 'stock',
    })),
  };
}

async function createAdminProduct(payload) {
  await ensureStoreSchema();

  if (!payload.categoryId) {
    throw new AppError(422, 'Category is required.');
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const productSlug = payload.slug
      ? slugifyProductName(payload.slug)
      : await generateUniqueProductSlug(connection, payload.name);

    if (payload.slug) {
      await ensureUniqueProductSlug(connection, productSlug);
    }

    const flags = productFlagsFromStatus(payload.status, payload.isActive !== false);
    const pricing = calculatePricingFields(payload);
    const discountPercent =
      pricing.discountPrice && Number(pricing.originalPrice) > 0
        ? Math.max(
            0,
            ((Number(pricing.originalPrice) - Number(pricing.discountPrice)) /
              Number(pricing.originalPrice)) *
              100
          )
        : 0;

    const [insertResult] = await connection.execute(
      `
        INSERT INTO products (
          category_id,
          name,
          slug,
          short_description,
          description,
          original_price,
          discount_price,
          discount_percent,
          cost_price,
          making_price,
          delivery_price,
          packing_price,
          profit_margin,
          payment_gateway_price,
          selling_price,
          final_selling_price,
          rounded_selling_price,
          mrp_mode,
          mrp_value,
          sku_prefix,
          featured_flag,
          trending_flag,
          coming_soon_flag,
          is_active,
          published_at,
          seo_title,
          seo_description
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?)
      `,
      [
        payload.categoryId,
        payload.name,
        productSlug,
        payload.shortDescription || null,
        payload.description || null,
        pricing.originalPrice,
        pricing.discountPrice ?? null,
        discountPercent,
        payload.costPrice ?? null,
        pricing.makingPrice,
        pricing.deliveryPrice,
        pricing.packingPrice,
        pricing.profitMargin,
        pricing.paymentGatewayPrice,
        pricing.sellingPrice,
        pricing.finalSellingPrice,
        pricing.roundedSellingPrice,
        pricing.mrpMode,
        pricing.mrpValue,
        payload.skuPrefix || productSlug.toUpperCase().replace(/[^A-Z0-9]+/g, '-'),
        payload.isFeatured ? 1 : 0,
        payload.isTrending ? 1 : 0,
        flags.isComingSoon ? 1 : 0,
        flags.isActive ? 1 : 0,
        payload.seoTitle || null,
        payload.seoDescription || null,
      ]
    );

    const productId = insertResult.insertId;

    if (Array.isArray(payload.images)) {
      await replaceProductImages(connection, productId, payload.images);
    }

    if (Array.isArray(payload.sizes)) {
      await replaceProductSizes(
        connection,
        productId,
        payload.sizes,
        payload.skuPrefix || productSlug.toUpperCase().replace(/[^A-Z0-9]+/g, '-')
      );
    }

    await connection.commit();
    return { productId, slug: productSlug };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function updateAdminProduct(productId, payload) {
  await ensureStoreSchema();

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [existingRows] = await connection.execute(
      `
        SELECT *
        FROM products
        WHERE id = ?
          AND deleted_at IS NULL
        LIMIT 1
      `,
      [productId]
    );

    const existing = existingRows[0];

    if (!existing) {
      throw new AppError(404, 'Product not found.');
    }

    if (payload.slug && payload.slug !== existing.slug) {
      await ensureUniqueProductSlug(connection, payload.slug, productId);
    }

    const pricing = calculatePricingFields(payload, {
      makingPrice: existing.making_price,
      deliveryPrice: existing.delivery_price,
      packingPrice: existing.packing_price,
      profitMargin: existing.profit_margin,
      paymentGatewayPrice: existing.payment_gateway_price,
      sellingPrice: existing.selling_price,
      finalSellingPrice: existing.final_selling_price,
      roundedSellingPrice: existing.rounded_selling_price,
      mrpMode: existing.mrp_mode,
      mrpValue: existing.mrp_value,
      originalPrice: existing.original_price,
      discountPrice: existing.discount_price,
    });
    const flags = productFlagsFromStatus(
      payload.status || productStatus(existing),
      payload.isActive !== undefined ? payload.isActive : Boolean(existing.is_active)
    );
    const discountPercent =
      pricing.discountPrice && Number(pricing.originalPrice) > 0
        ? Math.max(
            0,
            ((Number(pricing.originalPrice) - Number(pricing.discountPrice)) /
              Number(pricing.originalPrice)) *
              100
          )
        : 0;

    await connection.execute(
      `
        UPDATE products
        SET category_id = ?,
            name = ?,
            slug = ?,
            short_description = ?,
            description = ?,
            original_price = ?,
            discount_price = ?,
            discount_percent = ?,
            cost_price = ?,
            making_price = ?,
            delivery_price = ?,
            packing_price = ?,
            profit_margin = ?,
            payment_gateway_price = ?,
            selling_price = ?,
            final_selling_price = ?,
            rounded_selling_price = ?,
            mrp_mode = ?,
            mrp_value = ?,
            sku_prefix = ?,
            featured_flag = ?,
            trending_flag = ?,
            coming_soon_flag = ?,
            is_active = ?,
            seo_title = ?,
            seo_description = ?,
            updated_at = NOW()
        WHERE id = ?
      `,
      [
        payload.categoryId !== undefined ? payload.categoryId : existing.category_id,
        payload.name ?? existing.name,
        payload.slug ?? existing.slug,
        payload.shortDescription ?? existing.short_description,
        payload.description ?? existing.description,
        pricing.originalPrice,
        pricing.discountPrice,
        discountPercent,
        payload.costPrice !== undefined ? payload.costPrice : existing.cost_price,
        pricing.makingPrice,
        pricing.deliveryPrice,
        pricing.packingPrice,
        pricing.profitMargin,
        pricing.paymentGatewayPrice,
        pricing.sellingPrice,
        pricing.finalSellingPrice,
        pricing.roundedSellingPrice,
        pricing.mrpMode,
        pricing.mrpValue,
        payload.skuPrefix || existing.sku_prefix || (payload.slug ?? existing.slug).toUpperCase().replace(/[^A-Z0-9]+/g, '-'),
        payload.isFeatured !== undefined ? (payload.isFeatured ? 1 : 0) : existing.featured_flag,
        payload.isTrending !== undefined ? (payload.isTrending ? 1 : 0) : existing.trending_flag,
        flags.isComingSoon ? 1 : 0,
        flags.isActive ? 1 : 0,
        payload.seoTitle !== undefined ? payload.seoTitle : existing.seo_title,
        payload.seoDescription !== undefined ? payload.seoDescription : existing.seo_description,
        productId,
      ]
    );

    if (Array.isArray(payload.images)) {
      await replaceProductImages(connection, productId, payload.images);
    }

    if (Array.isArray(payload.sizes)) {
      await replaceProductSizes(
        connection,
        productId,
        payload.sizes,
        payload.skuPrefix || existing.sku_prefix || (payload.slug ?? existing.slug).toUpperCase().replace(/[^A-Z0-9]+/g, '-')
      );
    }

    await connection.commit();
    return { productId: Number(productId) };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function softDeleteAdminProduct(productId) {
  const existingRows = await query(
    `
      SELECT id
      FROM products
      WHERE id = ?
        AND deleted_at IS NULL
      LIMIT 1
    `,
    [productId]
  );

  if (!existingRows[0]) {
    throw new AppError(404, 'Product not found.');
  }

  await query(
    `
      UPDATE products
      SET deleted_at = NOW(),
          is_active = 0
      WHERE id = ?
    `,
    [productId]
  );

  return { productId: Number(productId) };
}

async function listDeletedAdminProducts() {
  const rows = await query(
    `
      SELECT
        p.id,
        p.name,
        p.slug,
        p.original_price AS price,
        p.discount_price AS discountPrice,
        p.deleted_at AS deletedAt,
        c.name AS categoryName,
        (
          SELECT file_url
          FROM product_images pi
          WHERE pi.product_id = p.id
            AND pi.deleted_at IS NULL
            AND pi.is_primary = 1
          ORDER BY pi.sort_order ASC, pi.id ASC
          LIMIT 1
        ) AS primaryImage,
        (
          SELECT media_type
          FROM product_images pi
          WHERE pi.product_id = p.id
            AND pi.deleted_at IS NULL
            AND pi.is_primary = 1
          ORDER BY pi.sort_order ASC, pi.id ASC
          LIMIT 1
        ) AS primaryMediaType,
        (
          SELECT COUNT(*)
          FROM order_items oi
          WHERE oi.product_id = p.id
        ) AS orderItemCount
      FROM products p
      LEFT JOIN categories c
        ON c.id = p.category_id
      WHERE p.deleted_at IS NOT NULL
      ORDER BY p.deleted_at DESC
    `
  );

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    price: Number(row.price),
    discountPrice: row.discountPrice !== null ? Number(row.discountPrice) : null,
    categoryName: row.categoryName,
    primaryImage: row.primaryImage,
    primaryMediaType: row.primaryMediaType || 'image',
    orderItemCount: Number(row.orderItemCount || 0),
    deletedAt: row.deletedAt,
  }));
}

async function restoreAdminProduct(productId) {
  const rows = await query(
    `
      SELECT id
      FROM products
      WHERE id = ?
        AND deleted_at IS NOT NULL
      LIMIT 1
    `,
    [productId]
  );

  if (!rows[0]) {
    throw new AppError(404, 'Deleted product not found.');
  }

  await query(
    `
      UPDATE products
      SET deleted_at = NULL,
          is_active = 1,
          updated_at = NOW()
      WHERE id = ?
    `,
    [productId]
  );

  return { productId: Number(productId) };
}

async function permanentlyDeleteAdminProduct(productId) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [orderRows] = await connection.execute(
      `
        SELECT COUNT(*) AS total
        FROM order_items
        WHERE product_id = ?
      `,
      [productId]
    );

    if (Number(orderRows[0].total) > 0) {
      throw new AppError(409, 'Product is linked to order history and cannot be permanently deleted.');
    }

    const [rows] = await connection.execute(
      `
        SELECT id
        FROM products
        WHERE id = ?
          AND deleted_at IS NOT NULL
        LIMIT 1
        FOR UPDATE
      `,
      [productId]
    );

    if (!rows[0]) {
      throw new AppError(404, 'Deleted product not found.');
    }

    await deleteWhereProductId(connection, 'notify_requests', productId);
    await deleteWhereProductId(connection, 'reviews', productId);
    await deleteWhereProductId(connection, 'wishlist_items', productId);
    await deleteWhereProductId(connection, 'carts', productId);
    await deleteWhereProductId(connection, 'cart_items', productId);
    await deleteWhereProductId(connection, 'product_images', productId);
    await deleteWhereProductId(connection, 'product_media', productId);

    if (await tableExists(connection, 'product_variants')) {
      await deleteWhereProductVariantId(connection, 'notify_requests', productId);
      await deleteWhereProductVariantId(connection, 'size_stock', productId);
      await deleteWhereProductVariantId(connection, 'cart_items', productId);

      await connection.execute(
        `
          DELETE FROM product_variants
          WHERE product_id = ?
        `,
        [productId]
      );
    }

    await deleteWhereProductId(connection, 'size_stock', productId);

    await connection.execute('DELETE FROM products WHERE id = ?', [productId]);

    await connection.commit();

    return { productId: Number(productId) };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function listAdminOrders(filters) {
  await ensureStoreSchema();

  const conditions = ['o.deleted_at IS NULL'];
  const params = [];

  if (filters.status) {
    conditions.push('o.order_status = ?');
    params.push(filters.status);
  }

  if (filters.search) {
    conditions.push(
      '(o.order_number LIKE ? OR o.customer_name LIKE ? OR o.customer_email LIKE ? OR o.customer_phone LIKE ?)'
    );
    const term = `%${filters.search}%`;
    params.push(term, term, term, term);
  }

  const rows = await query(
    `
      SELECT
        o.id,
        o.order_number AS orderNumber,
        o.customer_name AS customerName,
        o.customer_email AS customerEmail,
        o.customer_phone AS customerPhone,
        o.order_status AS status,
        o.payment_method AS paymentMethod,
        o.payment_status AS paymentStatus,
        o.refund_status AS refundStatus,
        o.refund_reference AS refundReference,
        o.subtotal_amount AS subtotal,
        o.discount_amount AS discountAmount,
        o.total_amount AS totalAmount,
        o.tracking_code AS trackingCode,
        o.ordered_at AS placedAt,
        COUNT(oi.id) AS itemsCount,
        (
          SELECT GROUP_CONCAT(
            CONCAT(COALESCE(pi.media_type, 'image'), '||', COALESCE(pi.file_url, ''))
            ORDER BY oi2.id ASC
            SEPARATOR '~~'
          )
          FROM order_items oi2
          LEFT JOIN product_images pi
            ON pi.product_id = oi2.product_id
            AND pi.deleted_at IS NULL
            AND pi.is_primary = 1
          WHERE oi2.order_id = o.id
        ) AS itemMedia
      FROM orders o
      LEFT JOIN order_items oi
        ON oi.order_id = o.id
      WHERE ${conditions.join(' AND ')}
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `,
    params
  );

  return rows.map((row) => ({
    id: row.id,
    orderNumber: row.orderNumber,
    customerName: row.customerName,
    customerEmail: row.customerEmail,
    customerPhone: row.customerPhone,
    status: row.status,
    paymentMethod: row.paymentMethod,
    paymentStatus: row.paymentStatus,
    refundStatus: row.refundStatus,
    refundReference: row.refundReference,
    subtotal: Number(row.subtotal),
    discountAmount: Number(row.discountAmount),
    totalAmount: Number(row.totalAmount),
    trackingCode: row.trackingCode,
    placedAt: row.placedAt,
    itemsCount: Number(row.itemsCount),
    itemMedia: String(row.itemMedia || '')
      .split('~~')
      .filter(Boolean)
      .map((entry) => {
        const [type, url] = entry.split('||');
        return { type: type || 'image', url: url || '' };
      })
      .filter((item) => item.url),
  }));
}

async function getAdminOrderByNumber(orderNumber) {
  await ensureStoreSchema();

  const rows = await query(
    `
      SELECT o.*
      FROM orders o
      WHERE o.order_number = ?
        AND o.deleted_at IS NULL
      LIMIT 1
    `,
    [orderNumber]
  );

  const order = rows[0];

  if (!order) {
    throw new AppError(404, 'Order not found.');
  }

  const items = await query(
    `
      SELECT
        oi.id,
        oi.product_id AS productId,
        oi.product_name AS productName,
        oi.product_slug AS productSlug,
        (
          SELECT pi.file_url
          FROM product_images pi
          WHERE pi.product_id = oi.product_id
            AND pi.deleted_at IS NULL
            AND pi.is_primary = 1
          ORDER BY pi.sort_order ASC, pi.id ASC
          LIMIT 1
        ) AS primaryImage,
        (
          SELECT pi.media_type
          FROM product_images pi
          WHERE pi.product_id = oi.product_id
            AND pi.deleted_at IS NULL
            AND pi.is_primary = 1
          ORDER BY pi.sort_order ASC, pi.id ASC
          LIMIT 1
        ) AS primaryMediaType,
        oi.size_code AS size,
        oi.quantity,
        oi.final_price AS unitPrice,
        oi.unit_price AS originalPrice,
        oi.discount_price AS discountPrice,
        oi.item_total AS lineTotal
      FROM order_items oi
      WHERE oi.order_id = ?
      ORDER BY oi.id ASC
    `,
    [order.id]
  );

  const address = parseAddressSnapshot(order.address_snapshot);
  const name = splitCustomerName(order.customer_name);

  return {
    id: order.id,
    orderNumber: order.order_number,
    customer: {
      firstName: address.firstName || name.firstName,
      lastName: address.lastName || name.lastName,
      email: order.customer_email,
      phone: order.customer_phone,
      addressLine1: address.addressLine1 || '',
      addressLine2: address.addressLine2 || '',
      city: address.city || '',
      state: address.state || '',
      postalCode: address.postalCode || '',
      addressLabel: address.addressLabel || address.label || '',
      notes: order.notes,
    },
    status: order.order_status,
    paymentMethod: order.payment_method,
    paymentStatus: order.payment_status,
    refundStatus: order.refund_status,
    refundReference: order.refund_reference,
    refundAmount: order.refund_amount !== null ? Number(order.refund_amount) : null,
    refundError: order.refund_error,
    razorpayOrderId: order.razorpay_order_id,
    razorpayPaymentId: order.razorpay_payment_id,
    paidAt: order.paid_at,
    trackingCode: order.tracking_code,
    cancelReason: order.cancel_reason,
    subtotal: Number(order.subtotal_amount),
    discountAmount: Number(order.discount_amount),
    totalAmount: Number(order.total_amount),
    placedAt: order.ordered_at,
    items: items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.productName,
      productSlug: item.productSlug,
      primaryImage: item.primaryImage,
      primaryMediaType: item.primaryMediaType || 'image',
      size: item.size,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      originalPrice: Number(item.originalPrice),
      discountPrice: item.discountPrice !== null ? Number(item.discountPrice) : null,
      lineTotal: Number(item.lineTotal),
    })),
  };
}

async function restoreCancelledOrderStock(connection, orderId) {
  const [items] = await connection.execute(
    `
      SELECT
        oi.quantity,
        ss.id AS stockId
      FROM order_items oi
      INNER JOIN size_stock ss
        ON ss.product_variant_id = oi.product_variant_id
      WHERE oi.order_id = ?
      FOR UPDATE
    `,
    [orderId]
  );

  for (const item of items) {
    await connection.execute(
      `
        UPDATE size_stock
        SET stock_qty = stock_qty + ?,
            stock_status = CASE
              WHEN stock_qty + ? <= 0 THEN 'out_of_stock'
              WHEN stock_qty + ? <= low_stock_threshold THEN 'low_stock'
              ELSE 'in_stock'
            END,
            updated_at = NOW()
        WHERE id = ?
      `,
      [item.quantity, item.quantity, item.quantity, item.stockId]
    );
  }
}

async function updateAdminOrderStatus(orderNumber, payload) {
  await ensureStoreSchema();

  const connection = await pool.getConnection();
  let nextRefundStatus = null;
  let nextRefundReference = null;
  let nextRefundAmount = null;
  let nextRefundError = null;

  try {
    await connection.beginTransaction();

    const [rows] = await connection.execute(
      `
        SELECT
          id,
          order_status AS status,
          payment_status AS paymentStatus,
          total_amount AS totalAmount,
          razorpay_payment_id AS razorpayPaymentId,
          refund_status AS refundStatus,
          customer_email AS customerEmail,
          customer_name AS customerName
        FROM orders
        WHERE order_number = ?
          AND deleted_at IS NULL
        LIMIT 1
        FOR UPDATE
      `,
      [orderNumber]
    );

    const order = rows[0];

    if (!order) {
      throw new AppError(404, 'Order not found.');
    }

    if (payload.status === 'cancelled' && !payload.cancelReason) {
      throw new AppError(422, 'Cancel reason is required when cancelling an order.');
    }

    const isNewCancellation =
      payload.status === 'cancelled' && order.status !== 'cancelled';

    if (isNewCancellation) {
      await restoreCancelledOrderStock(connection, order.id);

      if (order.paymentStatus === 'paid' && order.razorpayPaymentId) {
        try {
          const refund = await refundRazorpayPayment({
            razorpayPaymentId: order.razorpayPaymentId,
            amount: order.totalAmount,
            notes: {
              orderNumber,
              reason: payload.cancelReason || 'Admin cancelled order',
            },
          });

          nextRefundStatus = refund?.status || 'processed';
          nextRefundReference = refund?.id || null;
          nextRefundAmount = Number(order.totalAmount);
        } catch (error) {
          nextRefundStatus = 'failed';
          nextRefundError = error?.message || 'Refund failed.';
        }
      } else if (order.paymentStatus !== 'paid') {
        nextRefundStatus = 'not_required';
      }
    } else {
      nextRefundStatus = order.refundStatus;
    }

    await connection.execute(
      `
        UPDATE orders
        SET order_status = ?,
            tracking_code = ?,
            cancel_reason = ?,
            payment_status = CASE
              WHEN ? = 'cancelled' AND ? IN ('processed', 'captured', 'refunded') THEN 'refunded'
              ELSE payment_status
            END,
            refund_status = ?,
            refund_reference = COALESCE(?, refund_reference),
            refund_amount = COALESCE(?, refund_amount),
            refund_error = ?,
            refund_payload = CASE
              WHEN ? IS NOT NULL THEN JSON_OBJECT('status', ?, 'reference', ?, 'error', ?)
              ELSE refund_payload
            END,
            refunded_at = CASE
              WHEN ? IN ('processed', 'captured', 'refunded') THEN NOW()
              ELSE refunded_at
            END,
            cancellation_restocked_at = CASE
              WHEN ? = 'cancelled' AND ? = 'cancelled' THEN NOW()
              ELSE cancellation_restocked_at
            END,
            updated_at = NOW()
        WHERE id = ?
      `,
      [
        payload.status,
        payload.trackingCode || null,
        payload.cancelReason || null,
        payload.status,
        nextRefundStatus,
        nextRefundStatus,
        nextRefundReference,
        nextRefundAmount,
        nextRefundError,
        nextRefundStatus,
        nextRefundStatus,
        nextRefundReference,
        nextRefundError,
        nextRefundStatus,
        isNewCancellation ? 'cancelled' : null,
        payload.status,
        order.id,
      ]
    );

    await connection.commit();

    return {
      orderId: Number(order.id),
      orderNumber,
      status: payload.status,
      trackingCode: payload.trackingCode || null,
      cancelReason: payload.cancelReason || null,
      refundStatus: nextRefundStatus,
      refundReference: nextRefundReference,
      refundAmount: nextRefundAmount,
      refundError: nextRefundError,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function listAdminNotifyRequests(filters) {
  await ensureStoreSchema();

  const conditions = ['nr.deleted_at IS NULL'];
  const params = [];

  if (filters.status) {
    conditions.push('nr.status = ?');
    params.push(filters.status);
  }

  if (filters.search) {
    conditions.push('(nr.requester_email LIKE ? OR nr.requester_phone LIKE ? OR nr.requester_name LIKE ? OR p.name LIKE ?)');
    const term = `%${filters.search}%`;
    params.push(term, term, term, term);
  }

  const rows = await query(
    `
      SELECT
        nr.id,
        nr.requester_name AS fullName,
        nr.requester_email AS email,
        nr.requester_phone AS phone,
        pv.size_code AS size,
        nr.status,
        nr.admin_note AS adminNotes,
        nr.created_at AS createdAt,
        p.id AS productId,
        p.name AS productName,
        p.slug AS productSlug
      FROM notify_requests nr
      INNER JOIN products p
        ON p.id = nr.product_id
      LEFT JOIN product_variants pv
        ON pv.id = nr.product_variant_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY nr.created_at DESC
    `,
    params
  );

  return rows.map((row) => ({
    id: row.id,
    fullName: row.fullName,
    email: row.email,
    phone: row.phone,
    size: row.size,
    status: row.status,
    adminNotes: row.adminNotes,
    createdAt: row.createdAt,
    product: {
      id: row.productId,
      name: row.productName,
      slug: row.productSlug,
    },
  }));
}

async function updateAdminNotifyStatus(notifyRequestId, payload) {
  await ensureStoreSchema();

  const rows = await query(
    `
      SELECT id
      FROM notify_requests
      WHERE id = ?
        AND deleted_at IS NULL
      LIMIT 1
    `,
    [notifyRequestId]
  );

  if (!rows[0]) {
    throw new AppError(404, 'Notify request not found.');
  }

  await query(
    `
      UPDATE notify_requests
      SET status = ?,
          admin_note = ?,
          updated_at = NOW()
      WHERE id = ?
    `,
    [payload.status, payload.adminNotes || null, notifyRequestId]
  );

  return {
    notifyRequestId: Number(notifyRequestId),
    status: payload.status,
    adminNotes: payload.adminNotes || null,
  };
}

async function getAdminStorefrontSettings() {
  await ensureStoreSchema();

  const rows = await query(
    `
      SELECT setting_value AS settingValue
      FROM site_settings
      WHERE setting_key = ?
      LIMIT 1
    `,
    [VELOCITY_BANNER_KEY]
  );

  return {
    velocityBanner: {
      entries: parseBannerEntries(rows[0]?.settingValue),
    },
  };
}

async function updateAdminStorefrontSettings(payload) {
  await ensureStoreSchema();

  const entries = parseBannerEntries(JSON.stringify(payload?.velocityBanner?.entries || []));

  await query(
    `
      INSERT INTO site_settings (setting_key, setting_value)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE
        setting_value = VALUES(setting_value),
        updated_at = NOW()
    `,
    [VELOCITY_BANNER_KEY, JSON.stringify(entries)]
  );

  return {
    velocityBanner: {
      entries,
    },
  };
}

async function listAdminReturnRequests(filters) {
  await ensureStoreSchema();

  const conditions = ['rr.deleted_at IS NULL'];
  const params = [];

  if (filters.status) {
    conditions.push('rr.status = ?');
    params.push(filters.status);
  }

  if (filters.search) {
    conditions.push(
      '(rr.order_number_snapshot LIKE ? OR rr.product_name_snapshot LIKE ? OR u.email LIKE ?)'
    );
    const term = `%${filters.search}%`;
    params.push(term, term, term);
  }

  const rows = await query(
    `
      SELECT
        rr.id,
        rr.order_id AS orderId,
        rr.order_item_id AS orderItemId,
        rr.order_number_snapshot AS orderNumber,
        rr.product_name_snapshot AS productName,
        rr.size_label AS size,
        rr.reason,
        rr.status,
        rr.admin_notes AS adminNotes,
        rr.created_at AS createdAt,
        u.first_name AS firstName,
        u.last_name AS lastName,
        u.email
      FROM return_requests rr
      INNER JOIN users u
        ON u.id = rr.user_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY rr.created_at DESC
    `,
    params
  );

  return rows.map((row) => ({
    id: Number(row.id),
    orderId: Number(row.orderId),
    orderItemId: Number(row.orderItemId),
    orderNumber: row.orderNumber,
    productName: row.productName,
    size: row.size,
    reason: row.reason,
    status: row.status,
    adminNotes: row.adminNotes,
    createdAt: row.createdAt,
    customerName: [row.firstName, row.lastName].filter(Boolean).join(' '),
    customerEmail: row.email,
  }));
}

async function updateAdminReturnRequest(returnRequestId, payload) {
  await ensureStoreSchema();

  const rows = await query(
    `
      SELECT id
      FROM return_requests
      WHERE id = ?
        AND deleted_at IS NULL
      LIMIT 1
    `,
    [returnRequestId]
  );

  if (!rows[0]) {
    throw new AppError(404, 'Return request not found.');
  }

  await query(
    `
      UPDATE return_requests
      SET status = ?,
          admin_notes = ?,
          updated_at = NOW()
      WHERE id = ?
    `,
    [payload.status, payload.adminNotes || null, returnRequestId]
  );

  return {
    returnRequestId: Number(returnRequestId),
    status: payload.status,
    adminNotes: payload.adminNotes || null,
  };
}

module.exports = {
  listAdminProducts,
  getAdminProductById,
  createAdminProduct,
  updateAdminProduct,
  softDeleteAdminProduct,
  listDeletedAdminProducts,
  restoreAdminProduct,
  permanentlyDeleteAdminProduct,
  listAdminOrders,
  getAdminOrderByNumber,
  updateAdminOrderStatus,
  listAdminNotifyRequests,
  updateAdminNotifyStatus,
  getAdminStorefrontSettings,
  updateAdminStorefrontSettings,
  listAdminReturnRequests,
  updateAdminReturnRequest,
};
