USE parsom_brand;

CREATE TABLE IF NOT EXISTS product_variants (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_id BIGINT UNSIGNED NOT NULL,
  size_code VARCHAR(20) NOT NULL,
  sku VARCHAR(120) DEFAULT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  notify_only TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_product_variants_product_size (product_id, size_code),
  KEY idx_product_variants_product_id (product_id),
  KEY idx_product_variants_size_code (size_code),
  CONSTRAINT fk_product_variants_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB;

SET @sql := (SELECT IF(COUNT(*) = 0, 'ALTER TABLE size_stock ADD COLUMN product_variant_id BIGINT UNSIGNED DEFAULT NULL AFTER product_id', 'SELECT 1') FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'size_stock' AND COLUMN_NAME = 'product_variant_id');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (SELECT IF(COUNT(*) = 0, 'ALTER TABLE size_stock ADD COLUMN stock_status VARCHAR(30) NOT NULL DEFAULT ''in_stock'' AFTER low_stock_threshold', 'SELECT 1') FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'size_stock' AND COLUMN_NAME = 'stock_status');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

ALTER TABLE size_stock MODIFY product_id BIGINT UNSIGNED DEFAULT NULL;

INSERT INTO product_variants (product_id, size_code, sku, is_active, notify_only, created_at, updated_at, deleted_at)
SELECT
  ss.product_id,
  UPPER(ss.size_label),
  CONCAT('PSM-', ss.product_id, '-', UPPER(ss.size_label)),
  ss.is_active,
  0,
  ss.created_at,
  ss.updated_at,
  ss.deleted_at
FROM size_stock ss
LEFT JOIN product_variants pv
  ON pv.product_id = ss.product_id
  AND pv.size_code = UPPER(ss.size_label)
WHERE ss.product_id IS NOT NULL
  AND ss.size_label IS NOT NULL
  AND pv.id IS NULL;

UPDATE size_stock ss
INNER JOIN product_variants pv
  ON pv.product_id = ss.product_id
  AND pv.size_code = UPPER(ss.size_label)
SET ss.product_variant_id = pv.id
WHERE ss.product_variant_id IS NULL;

UPDATE size_stock
SET stock_status = CASE
  WHEN stock_qty - reserved_qty <= 0 THEN 'out_of_stock'
  WHEN stock_qty - reserved_qty <= low_stock_threshold THEN 'low_stock'
  ELSE 'in_stock'
END;

SET @sql := (SELECT IF(COUNT(*) = 0, 'ALTER TABLE size_stock ADD INDEX idx_size_stock_product_variant_id (product_variant_id)', 'SELECT 1') FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'size_stock' AND INDEX_NAME = 'idx_size_stock_product_variant_id');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (SELECT IF(COUNT(*) = 0, 'ALTER TABLE order_items ADD COLUMN product_variant_id BIGINT UNSIGNED DEFAULT NULL AFTER product_id', 'SELECT 1') FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_items' AND COLUMN_NAME = 'product_variant_id');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (SELECT IF(COUNT(*) = 0, 'ALTER TABLE order_items ADD COLUMN product_name VARCHAR(180) DEFAULT NULL AFTER product_variant_id', 'SELECT 1') FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_items' AND COLUMN_NAME = 'product_name');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (SELECT IF(COUNT(*) = 0, 'ALTER TABLE order_items ADD COLUMN product_slug VARCHAR(220) DEFAULT NULL AFTER product_name', 'SELECT 1') FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_items' AND COLUMN_NAME = 'product_slug');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (SELECT IF(COUNT(*) = 0, 'ALTER TABLE order_items ADD COLUMN size_code VARCHAR(20) DEFAULT NULL AFTER product_slug', 'SELECT 1') FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_items' AND COLUMN_NAME = 'size_code');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (SELECT IF(COUNT(*) = 0, 'ALTER TABLE order_items ADD COLUMN final_price DECIMAL(12,2) DEFAULT NULL AFTER discount_price', 'SELECT 1') FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_items' AND COLUMN_NAME = 'final_price');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (SELECT IF(COUNT(*) = 0, 'ALTER TABLE order_items ADD COLUMN cost_price DECIMAL(12,2) DEFAULT NULL AFTER final_price', 'SELECT 1') FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_items' AND COLUMN_NAME = 'cost_price');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (SELECT IF(COUNT(*) = 0, 'ALTER TABLE order_items ADD COLUMN item_total DECIMAL(12,2) DEFAULT NULL AFTER cost_price', 'SELECT 1') FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_items' AND COLUMN_NAME = 'item_total');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

ALTER TABLE order_items
  MODIFY product_name_snapshot VARCHAR(180) DEFAULT NULL,
  MODIFY product_slug_snapshot VARCHAR(220) DEFAULT NULL,
  MODIFY size_label VARCHAR(20) DEFAULT NULL,
  MODIFY original_price DECIMAL(12,2) DEFAULT NULL,
  MODIFY line_total DECIMAL(12,2) DEFAULT NULL;

UPDATE order_items
SET
  product_name = COALESCE(product_name, product_name_snapshot),
  product_slug = COALESCE(product_slug, product_slug_snapshot),
  size_code = COALESCE(size_code, size_label),
  final_price = COALESCE(final_price, discount_price, unit_price),
  item_total = COALESCE(item_total, line_total);

SET @sql := (SELECT IF(COUNT(*) = 0, 'ALTER TABLE notify_requests ADD COLUMN product_variant_id BIGINT UNSIGNED DEFAULT NULL AFTER product_id', 'SELECT 1') FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notify_requests' AND COLUMN_NAME = 'product_variant_id');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (SELECT IF(COUNT(*) = 0, 'ALTER TABLE notify_requests ADD COLUMN requester_name VARCHAR(160) DEFAULT NULL AFTER product_variant_id', 'SELECT 1') FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notify_requests' AND COLUMN_NAME = 'requester_name');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (SELECT IF(COUNT(*) = 0, 'ALTER TABLE notify_requests ADD COLUMN requester_email VARCHAR(190) DEFAULT NULL AFTER requester_name', 'SELECT 1') FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notify_requests' AND COLUMN_NAME = 'requester_email');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (SELECT IF(COUNT(*) = 0, 'ALTER TABLE notify_requests ADD COLUMN requester_phone VARCHAR(30) DEFAULT NULL AFTER requester_email', 'SELECT 1') FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notify_requests' AND COLUMN_NAME = 'requester_phone');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

ALTER TABLE notify_requests
  MODIFY size_label VARCHAR(20) DEFAULT NULL,
  MODIFY full_name VARCHAR(160) DEFAULT NULL,
  MODIFY email VARCHAR(190) DEFAULT NULL,
  MODIFY phone VARCHAR(30) DEFAULT NULL;

UPDATE notify_requests nr
LEFT JOIN product_variants pv
  ON pv.product_id = nr.product_id
  AND pv.size_code = UPPER(nr.size_label)
SET
  nr.product_variant_id = COALESCE(nr.product_variant_id, pv.id),
  nr.requester_name = COALESCE(nr.requester_name, nr.full_name),
  nr.requester_email = COALESCE(nr.requester_email, nr.email),
  nr.requester_phone = COALESCE(nr.requester_phone, nr.phone);
