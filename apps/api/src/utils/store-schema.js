const { query } = require('../config/db');

let ensureStoreSchemaPromise = null;

async function tableExists(tableName) {
  const rows = await query(
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

async function columnExists(tableName, columnName) {
  const rows = await query(
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

async function getColumnType(tableName, columnName) {
  const rows = await query(
    `
      SELECT COLUMN_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
        AND COLUMN_NAME = ?
      LIMIT 1
    `,
    [tableName, columnName]
  );

  return rows[0]?.COLUMN_TYPE || '';
}

async function indexExists(tableName, indexName) {
  const rows = await query(
    `
      SELECT INDEX_NAME
      FROM INFORMATION_SCHEMA.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
        AND INDEX_NAME = ?
      LIMIT 1
    `,
    [tableName, indexName]
  );

  return Boolean(rows[0]);
}

async function addColumnIfMissing(tableName, columnName, definition) {
  if (await columnExists(tableName, columnName)) return;
  await query(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
}

async function addIndexIfMissing(tableName, indexName, definition) {
  if (await indexExists(tableName, indexName)) return;
  await query(`ALTER TABLE ${tableName} ADD INDEX ${indexName} ${definition}`);
}

async function ensureProductsPricingSchema() {
  await addColumnIfMissing(
    'products',
    'discount_percent',
    'DECIMAL(5,2) NOT NULL DEFAULT 0 AFTER discount_price'
  );
  await addColumnIfMissing(
    'products',
    'making_price',
    'DECIMAL(12,2) DEFAULT NULL AFTER cost_price'
  );
  await addColumnIfMissing(
    'products',
    'delivery_price',
    'DECIMAL(12,2) DEFAULT NULL AFTER making_price'
  );
  await addColumnIfMissing(
    'products',
    'packing_price',
    'DECIMAL(12,2) DEFAULT NULL AFTER delivery_price'
  );
  await addColumnIfMissing(
    'products',
    'profit_margin',
    'DECIMAL(12,2) DEFAULT NULL AFTER packing_price'
  );
  await addColumnIfMissing(
    'products',
    'payment_gateway_price',
    'DECIMAL(12,2) DEFAULT NULL AFTER profit_margin'
  );
  await addColumnIfMissing(
    'products',
    'selling_price',
    'DECIMAL(12,2) DEFAULT NULL AFTER payment_gateway_price'
  );
  await addColumnIfMissing(
    'products',
    'final_selling_price',
    'DECIMAL(12,2) DEFAULT NULL AFTER selling_price'
  );
  await addColumnIfMissing(
    'products',
    'rounded_selling_price',
    'DECIMAL(12,2) DEFAULT NULL AFTER final_selling_price'
  );
  await addColumnIfMissing(
    'products',
    'mrp_mode',
    "VARCHAR(20) NOT NULL DEFAULT 'amount' AFTER rounded_selling_price"
  );
  await addColumnIfMissing(
    'products',
    'mrp_value',
    'DECIMAL(12,2) DEFAULT NULL AFTER mrp_mode'
  );
  await addColumnIfMissing(
    'products',
    'sku_prefix',
    'VARCHAR(80) DEFAULT NULL AFTER mrp_value'
  );
  await addColumnIfMissing(
    'products',
    'published_at',
    'DATETIME DEFAULT NULL AFTER is_active'
  );
}

async function ensureVariantNotifySchema() {
  if (!(await tableExists('product_variants'))) return;

  await addColumnIfMissing(
    'product_variants',
    'notify_only',
    'TINYINT(1) NOT NULL DEFAULT 0 AFTER is_active'
  );
}

async function ensureOrdersSchema() {
  const paymentMethodType = await getColumnType('orders', 'payment_method');
  if (paymentMethodType && !paymentMethodType.includes("'cod'")) {
    await query(
      "ALTER TABLE orders MODIFY payment_method ENUM('whatsapp','manual','razorpay','cod') NOT NULL DEFAULT 'whatsapp'"
    );
  }

  await addColumnIfMissing(
    'orders',
    'refund_status',
    "VARCHAR(30) DEFAULT NULL AFTER payment_status"
  );
  await addColumnIfMissing(
    'orders',
    'refund_reference',
    'VARCHAR(120) DEFAULT NULL AFTER refund_status'
  );
  await addColumnIfMissing(
    'orders',
    'refund_amount',
    'DECIMAL(12,2) DEFAULT NULL AFTER refund_reference'
  );
  await addColumnIfMissing(
    'orders',
    'refund_error',
    'TEXT DEFAULT NULL AFTER refund_amount'
  );
  await addColumnIfMissing(
    'orders',
    'refund_payload',
    'LONGTEXT DEFAULT NULL AFTER refund_error'
  );
  await addColumnIfMissing(
    'orders',
    'refunded_at',
    'DATETIME DEFAULT NULL AFTER refund_payload'
  );
  await addColumnIfMissing(
    'orders',
    'cancellation_restocked_at',
    'DATETIME DEFAULT NULL AFTER refunded_at'
  );
  await addColumnIfMissing(
    'orders',
    'terms_accepted_at',
    'DATETIME DEFAULT NULL AFTER cancellation_restocked_at'
  );
  await addColumnIfMissing(
    'orders',
    'return_policy_accepted_at',
    'DATETIME DEFAULT NULL AFTER terms_accepted_at'
  );
  await addColumnIfMissing(
    'orders',
    'coupon_code',
    'VARCHAR(80) DEFAULT NULL AFTER coupon_id'
  );
  await addColumnIfMissing(
    'orders',
    'cod_unlocked_by_coupon',
    'TINYINT(1) NOT NULL DEFAULT 0 AFTER coupon_code'
  );
  await addColumnIfMissing(
    'orders',
    'hidden_coupon_applied',
    'TINYINT(1) NOT NULL DEFAULT 0 AFTER cod_unlocked_by_coupon'
  );
}

async function ensureCouponsSchema() {
  await addColumnIfMissing(
    'coupons',
    'is_hidden',
    'TINYINT(1) NOT NULL DEFAULT 0 AFTER is_active'
  );
  await addColumnIfMissing(
    'coupons',
    'unlocks_cod',
    'TINYINT(1) NOT NULL DEFAULT 0 AFTER is_hidden'
  );
}

async function ensureSiteSettingsSchema() {
  if (!(await tableExists('site_settings'))) {
    await query(`
      CREATE TABLE site_settings (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        setting_key VARCHAR(100) NOT NULL,
        setting_value LONGTEXT DEFAULT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uniq_site_settings_key (setting_key)
      ) ENGINE=InnoDB
    `);
  }
}

async function ensureReturnRequestsSchema() {
  if (!(await tableExists('return_requests'))) {
    await query(`
      CREATE TABLE return_requests (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        user_id BIGINT UNSIGNED NOT NULL,
        order_id BIGINT UNSIGNED NOT NULL,
        order_item_id BIGINT UNSIGNED NOT NULL,
        product_id BIGINT UNSIGNED NOT NULL,
        order_number_snapshot VARCHAR(50) NOT NULL,
        product_name_snapshot VARCHAR(180) NOT NULL,
        size_label VARCHAR(20) NOT NULL,
        reason TEXT NOT NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'pending',
        admin_notes TEXT DEFAULT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at DATETIME DEFAULT NULL,
        PRIMARY KEY (id),
        KEY idx_return_requests_user_id (user_id),
        KEY idx_return_requests_order_id (order_id),
        KEY idx_return_requests_order_item_id (order_item_id),
        KEY idx_return_requests_status (status),
        CONSTRAINT fk_return_requests_user
          FOREIGN KEY (user_id) REFERENCES users(id)
          ON UPDATE CASCADE
          ON DELETE CASCADE,
        CONSTRAINT fk_return_requests_order
          FOREIGN KEY (order_id) REFERENCES orders(id)
          ON UPDATE CASCADE
          ON DELETE CASCADE,
        CONSTRAINT fk_return_requests_order_item
          FOREIGN KEY (order_item_id) REFERENCES order_items(id)
          ON UPDATE CASCADE
          ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);
  }

  await addIndexIfMissing(
    'return_requests',
    'idx_return_requests_product_id',
    '(product_id)'
  );
  await addColumnIfMissing(
    'return_requests',
    'refund_status',
    'VARCHAR(30) DEFAULT NULL AFTER admin_notes'
  );
  await addColumnIfMissing(
    'return_requests',
    'refund_reference',
    'VARCHAR(120) DEFAULT NULL AFTER refund_status'
  );
  await addColumnIfMissing(
    'return_requests',
    'refund_amount',
    'DECIMAL(12,2) DEFAULT NULL AFTER refund_reference'
  );
  await addColumnIfMissing(
    'return_requests',
    'refund_error',
    'TEXT DEFAULT NULL AFTER refund_amount'
  );
  await addColumnIfMissing(
    'return_requests',
    'refund_payload',
    'LONGTEXT DEFAULT NULL AFTER refund_error'
  );
  await addColumnIfMissing(
    'return_requests',
    'refunded_at',
    'DATETIME DEFAULT NULL AFTER refund_payload'
  );
}

async function ensureWebsiteReviewsSchema() {
  if (!(await tableExists('website_reviews'))) {
    await query(`
      CREATE TABLE website_reviews (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        user_id BIGINT UNSIGNED DEFAULT NULL,
        reviewer_name VARCHAR(160) NOT NULL,
        reviewer_email VARCHAR(190) DEFAULT NULL,
        reviewer_avatar_url VARCHAR(500) DEFAULT NULL,
        rating TINYINT NOT NULL,
        comment TEXT NOT NULL,
        source VARCHAR(30) NOT NULL DEFAULT 'customer',
        platform VARCHAR(40) DEFAULT NULL,
        is_published TINYINT(1) NOT NULL DEFAULT 1,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at DATETIME DEFAULT NULL,
        PRIMARY KEY (id),
        UNIQUE KEY uniq_website_reviews_user (user_id),
        KEY idx_website_reviews_published (is_published, deleted_at, created_at),
        KEY idx_website_reviews_source (source),
        CONSTRAINT fk_website_reviews_user
          FOREIGN KEY (user_id) REFERENCES users(id)
          ON UPDATE CASCADE
          ON DELETE SET NULL
      ) ENGINE=InnoDB
    `);
  }

  await addColumnIfMissing(
    'website_reviews',
    'reviewer_avatar_url',
    'VARCHAR(500) DEFAULT NULL AFTER reviewer_email'
  );
  await addColumnIfMissing(
    'website_reviews',
    'platform',
    'VARCHAR(40) DEFAULT NULL AFTER source'
  );
  await addIndexIfMissing(
    'website_reviews',
    'idx_website_reviews_published',
    '(is_published, deleted_at, created_at)'
  );
  await addIndexIfMissing(
    'website_reviews',
    'idx_website_reviews_source',
    '(source)'
  );
}

async function ensureStoreSchema() {
  if (!ensureStoreSchemaPromise) {
    ensureStoreSchemaPromise = (async () => {
      await ensureProductsPricingSchema();
      await ensureVariantNotifySchema();
      await ensureOrdersSchema();
      await ensureCouponsSchema();
      await ensureSiteSettingsSchema();
      await ensureReturnRequestsSchema();
      await ensureWebsiteReviewsSchema();
    })().catch((error) => {
      ensureStoreSchemaPromise = null;
      throw error;
    });
  }

  await ensureStoreSchemaPromise;
}

module.exports = {
  ensureStoreSchema,
};
