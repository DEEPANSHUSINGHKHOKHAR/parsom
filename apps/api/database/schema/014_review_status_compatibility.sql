USE parsom_brand;

SET @sql := (SELECT IF(COUNT(*) = 0, 'ALTER TABLE reviews ADD COLUMN review_status VARCHAR(30) NOT NULL DEFAULT ''approved'' AFTER is_published', 'SELECT 1') FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'reviews' AND COLUMN_NAME = 'review_status');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE reviews
SET review_status = CASE
  WHEN is_published = 1 THEN 'approved'
  ELSE 'pending'
END
WHERE review_status IS NULL
  OR review_status = '';

SET @sql := (SELECT IF(COUNT(*) = 0, 'ALTER TABLE reviews ADD INDEX idx_reviews_status (review_status)', 'SELECT 1') FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'reviews' AND INDEX_NAME = 'idx_reviews_status');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
