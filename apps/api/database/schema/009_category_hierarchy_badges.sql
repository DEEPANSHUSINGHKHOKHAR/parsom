USE parsom_brand;

SET @sql := IF(
  (SELECT COUNT(*)
   FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'categories'
     AND COLUMN_NAME = 'audience') = 0,
  "ALTER TABLE categories ADD COLUMN audience VARCHAR(20) NOT NULL DEFAULT 'women' AFTER slug",
  "SELECT 1"
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := IF(
  (SELECT COUNT(*)
   FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'categories'
     AND COLUMN_NAME = 'parent_id') = 0,
  'ALTER TABLE categories ADD COLUMN parent_id BIGINT UNSIGNED DEFAULT NULL AFTER audience',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := IF(
  (SELECT COUNT(*)
   FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'categories'
     AND COLUMN_NAME = 'badge') = 0,
  "ALTER TABLE categories ADD COLUMN badge VARCHAR(20) NOT NULL DEFAULT '' AFTER parent_id",
  "SELECT 1"
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := IF(
  (SELECT COUNT(*)
   FROM INFORMATION_SCHEMA.STATISTICS
   WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'categories'
     AND INDEX_NAME = 'uniq_categories_name') > 0,
  'ALTER TABLE categories DROP INDEX uniq_categories_name',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := IF(
  (SELECT COUNT(*)
   FROM INFORMATION_SCHEMA.STATISTICS
   WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'categories'
     AND INDEX_NAME = 'idx_categories_parent_id') = 0,
  'ALTER TABLE categories ADD INDEX idx_categories_parent_id (parent_id)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := IF(
  (SELECT COUNT(*)
   FROM INFORMATION_SCHEMA.STATISTICS
   WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'categories'
     AND INDEX_NAME = 'idx_categories_audience') = 0,
  'ALTER TABLE categories ADD INDEX idx_categories_audience (audience)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
