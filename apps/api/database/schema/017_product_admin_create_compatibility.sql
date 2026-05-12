USE parsom_brand;

SET @sql := (SELECT IF(COUNT(*) = 0, 'ALTER TABLE products ADD COLUMN discount_percent DECIMAL(5,2) NOT NULL DEFAULT 0 AFTER discount_price', 'SELECT 1') FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND COLUMN_NAME = 'discount_percent');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (SELECT IF(COUNT(*) = 0, 'ALTER TABLE products ADD COLUMN sku_prefix VARCHAR(80) DEFAULT NULL AFTER mrp_value', 'SELECT 1') FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND COLUMN_NAME = 'sku_prefix');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (SELECT IF(COUNT(*) = 0, 'ALTER TABLE products ADD COLUMN published_at DATETIME DEFAULT NULL AFTER is_active', 'SELECT 1') FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND COLUMN_NAME = 'published_at');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE products
SET
  discount_percent = CASE
    WHEN discount_price IS NOT NULL AND COALESCE(original_price, price) > 0
      THEN GREATEST(0, ((COALESCE(original_price, price) - discount_price) / COALESCE(original_price, price)) * 100)
    ELSE COALESCE(discount_percent, 0)
  END,
  sku_prefix = COALESCE(NULLIF(sku_prefix, ''), UPPER(REPLACE(slug, '-', '-'))),
  published_at = CASE
    WHEN is_active = 1 AND published_at IS NULL THEN COALESCE(created_at, NOW())
    ELSE published_at
  END;
