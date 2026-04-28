ALTER TABLE products
  ADD COLUMN making_price DECIMAL(12,2) DEFAULT NULL AFTER cost_price,
  ADD COLUMN delivery_price DECIMAL(12,2) DEFAULT NULL AFTER making_price,
  ADD COLUMN packing_price DECIMAL(12,2) DEFAULT NULL AFTER delivery_price,
  ADD COLUMN profit_margin DECIMAL(12,2) DEFAULT NULL AFTER packing_price,
  ADD COLUMN payment_gateway_price DECIMAL(12,2) DEFAULT NULL AFTER profit_margin,
  ADD COLUMN selling_price DECIMAL(12,2) DEFAULT NULL AFTER payment_gateway_price,
  ADD COLUMN final_selling_price DECIMAL(12,2) DEFAULT NULL AFTER selling_price,
  ADD COLUMN rounded_selling_price DECIMAL(12,2) DEFAULT NULL AFTER final_selling_price,
  ADD COLUMN mrp_mode VARCHAR(20) NOT NULL DEFAULT 'amount' AFTER rounded_selling_price,
  ADD COLUMN mrp_value DECIMAL(12,2) DEFAULT NULL AFTER mrp_mode;

ALTER TABLE product_variants
  ADD COLUMN notify_only TINYINT(1) NOT NULL DEFAULT 0 AFTER is_active;

ALTER TABLE orders
  ADD COLUMN refund_status VARCHAR(30) DEFAULT NULL AFTER payment_status,
  ADD COLUMN refund_reference VARCHAR(120) DEFAULT NULL AFTER refund_status,
  ADD COLUMN refund_amount DECIMAL(12,2) DEFAULT NULL AFTER refund_reference,
  ADD COLUMN refund_error TEXT DEFAULT NULL AFTER refund_amount,
  ADD COLUMN refund_payload LONGTEXT DEFAULT NULL AFTER refund_error,
  ADD COLUMN refunded_at DATETIME DEFAULT NULL AFTER refund_payload,
  ADD COLUMN cancellation_restocked_at DATETIME DEFAULT NULL AFTER refunded_at,
  ADD COLUMN terms_accepted_at DATETIME DEFAULT NULL AFTER cancellation_restocked_at,
  ADD COLUMN return_policy_accepted_at DATETIME DEFAULT NULL AFTER terms_accepted_at;

CREATE TABLE IF NOT EXISTS site_settings (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  setting_key VARCHAR(100) NOT NULL,
  setting_value LONGTEXT DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_site_settings_key (setting_key)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS return_requests (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  order_id BIGINT UNSIGNED NOT NULL,
  order_item_id BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NOT NULL,
  order_number_snapshot VARCHAR(50) NOT NULL,
  product_name_snapshot VARCHAR(180) NOT NULL,
  size_label VARCHAR(20) NOT NULL,
  reason TEXT NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  admin_notes TEXT DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME DEFAULT NULL,
  PRIMARY KEY (id),
  KEY idx_return_requests_user_id (user_id),
  KEY idx_return_requests_order_id (order_id),
  KEY idx_return_requests_order_item_id (order_item_id),
  KEY idx_return_requests_status (status),
  KEY idx_return_requests_product_id (product_id),
  CONSTRAINT fk_return_requests_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_return_requests_order
    FOREIGN KEY (order_id) REFERENCES orders(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_return_requests_order_item
    FOREIGN KEY (order_item_id) REFERENCES order_items(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB;
