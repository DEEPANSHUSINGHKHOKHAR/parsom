USE parsom_brand;

CREATE TABLE IF NOT EXISTS website_reviews (
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
) ENGINE=InnoDB;

SET @has_reviewer_avatar_url := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'website_reviews'
    AND COLUMN_NAME = 'reviewer_avatar_url'
);
SET @add_reviewer_avatar_url := IF(
  @has_reviewer_avatar_url = 0,
  'ALTER TABLE website_reviews ADD COLUMN reviewer_avatar_url VARCHAR(500) DEFAULT NULL AFTER reviewer_email',
  'SELECT 1'
);
PREPARE add_reviewer_avatar_url_stmt FROM @add_reviewer_avatar_url;
EXECUTE add_reviewer_avatar_url_stmt;
DEALLOCATE PREPARE add_reviewer_avatar_url_stmt;

SET @has_platform := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'website_reviews'
    AND COLUMN_NAME = 'platform'
);
SET @add_platform := IF(
  @has_platform = 0,
  'ALTER TABLE website_reviews ADD COLUMN platform VARCHAR(40) DEFAULT NULL AFTER source',
  'SELECT 1'
);
PREPARE add_platform_stmt FROM @add_platform;
EXECUTE add_platform_stmt;
DEALLOCATE PREPARE add_platform_stmt;
