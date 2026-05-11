USE parsom_brand;

SET @add_admin_reply := (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE reviews ADD COLUMN admin_reply TEXT DEFAULT NULL',
    'SELECT 1'
  )
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'reviews'
    AND COLUMN_NAME = 'admin_reply'
);

PREPARE add_admin_reply_stmt FROM @add_admin_reply;
EXECUTE add_admin_reply_stmt;
DEALLOCATE PREPARE add_admin_reply_stmt;
