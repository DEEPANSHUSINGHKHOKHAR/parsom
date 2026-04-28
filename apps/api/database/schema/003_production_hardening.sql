USE parsom_brand;

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  actor_type ENUM('admin','user','system') NOT NULL DEFAULT 'system',
  actor_id BIGINT UNSIGNED DEFAULT NULL,
  action_key VARCHAR(120) NOT NULL,
  resource_type VARCHAR(120) NOT NULL,
  resource_id VARCHAR(120) DEFAULT NULL,
  ip_address VARCHAR(64) DEFAULT NULL,
  user_agent VARCHAR(500) DEFAULT NULL,
  meta_json JSON DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_audit_logs_actor (actor_type, actor_id),
  KEY idx_audit_logs_action (action_key),
  KEY idx_audit_logs_resource (resource_type, resource_id),
  KEY idx_audit_logs_created_at (created_at)
) ENGINE=InnoDB;