ALTER TABLE return_requests
  ADD COLUMN refund_status VARCHAR(30) DEFAULT NULL AFTER admin_notes,
  ADD COLUMN refund_reference VARCHAR(120) DEFAULT NULL AFTER refund_status,
  ADD COLUMN refund_amount DECIMAL(12,2) DEFAULT NULL AFTER refund_reference,
  ADD COLUMN refund_error TEXT DEFAULT NULL AFTER refund_amount,
  ADD COLUMN refund_payload LONGTEXT DEFAULT NULL AFTER refund_error,
  ADD COLUMN refunded_at DATETIME DEFAULT NULL AFTER refund_payload;
