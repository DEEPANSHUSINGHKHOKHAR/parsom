USE parsom_brand;

SET @sql := (SELECT IF(COUNT(*) = 0, 'ALTER TABLE users ADD COLUMN account_status VARCHAR(30) NOT NULL DEFAULT ''active'' AFTER is_email_verified', 'SELECT 1') FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'account_status');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE users
SET account_status = CASE WHEN is_active = 1 THEN 'active' ELSE 'inactive' END
WHERE account_status IS NULL
  OR account_status = '';

SET @sql := (SELECT IF(COUNT(*) = 0, 'ALTER TABLE admins ADD COLUMN full_name VARCHAR(160) DEFAULT NULL AFTER id', 'SELECT 1') FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'admins' AND COLUMN_NAME = 'full_name');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (SELECT IF(COUNT(*) = 0, 'ALTER TABLE admins ADD COLUMN account_status VARCHAR(30) NOT NULL DEFAULT ''active'' AFTER role', 'SELECT 1') FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'admins' AND COLUMN_NAME = 'account_status');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE admins
SET
  full_name = COALESCE(full_name, name),
  account_status = CASE WHEN is_active = 1 THEN 'active' ELSE 'inactive' END
WHERE full_name IS NULL
  OR full_name = ''
  OR account_status IS NULL
  OR account_status = '';
