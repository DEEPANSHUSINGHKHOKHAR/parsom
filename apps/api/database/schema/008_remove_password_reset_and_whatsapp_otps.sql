USE parsom_brand;

DROP TABLE IF EXISTS whatsapp_login_otps;
DROP TABLE IF EXISTS password_reset_otps;

UPDATE users
SET auth_provider = 'email'
WHERE auth_provider = 'whatsapp_otp';

ALTER TABLE users
	MODIFY auth_provider ENUM('email', 'google') NOT NULL DEFAULT 'email';
