USE parsom_brand;

ALTER TABLE users
  MODIFY auth_provider ENUM('email','whatsapp_otp','google') NOT NULL DEFAULT 'email';

ALTER TABLE users
  ADD COLUMN google_sub VARCHAR(255) DEFAULT NULL AFTER auth_provider;

ALTER TABLE users
  ADD UNIQUE KEY uniq_users_google_sub (google_sub);

ALTER TABLE users
  ADD COLUMN is_email_verified TINYINT(1) NOT NULL DEFAULT 0 AFTER google_sub;
