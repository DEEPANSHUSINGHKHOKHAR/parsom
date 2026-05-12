USE parsom_brand;

SET @sql := (SELECT IF(COUNT(*) = 0, 'ALTER TABLE products ADD COLUMN original_price DECIMAL(12,2) DEFAULT NULL AFTER price', 'SELECT 1') FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND COLUMN_NAME = 'original_price');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (SELECT IF(COUNT(*) = 0, 'ALTER TABLE products ADD COLUMN featured_flag TINYINT(1) NOT NULL DEFAULT 0 AFTER is_featured', 'SELECT 1') FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND COLUMN_NAME = 'featured_flag');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (SELECT IF(COUNT(*) = 0, 'ALTER TABLE products ADD COLUMN trending_flag TINYINT(1) NOT NULL DEFAULT 0 AFTER is_trending', 'SELECT 1') FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND COLUMN_NAME = 'trending_flag');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (SELECT IF(COUNT(*) = 0, 'ALTER TABLE products ADD COLUMN coming_soon_flag TINYINT(1) NOT NULL DEFAULT 0 AFTER trending_flag', 'SELECT 1') FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND COLUMN_NAME = 'coming_soon_flag');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE products
SET
  original_price = COALESCE(original_price, price),
  featured_flag = CASE WHEN is_featured = 1 THEN 1 ELSE featured_flag END,
  trending_flag = CASE WHEN is_trending = 1 THEN 1 ELSE trending_flag END,
  coming_soon_flag = CASE WHEN status = 'coming_soon' THEN 1 ELSE coming_soon_flag END;

SET @sql := (SELECT IF(COUNT(*) = 0, 'ALTER TABLE products ADD INDEX idx_products_featured_flag (featured_flag)', 'SELECT 1') FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND INDEX_NAME = 'idx_products_featured_flag');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (SELECT IF(COUNT(*) = 0, 'ALTER TABLE products ADD INDEX idx_products_trending_flag (trending_flag)', 'SELECT 1') FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND INDEX_NAME = 'idx_products_trending_flag');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
