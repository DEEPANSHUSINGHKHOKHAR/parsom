ALTER TABLE orders
  MODIFY payment_method ENUM('whatsapp','manual','razorpay') NOT NULL DEFAULT 'whatsapp',
  ADD COLUMN razorpay_order_id VARCHAR(120) DEFAULT NULL AFTER payment_status,
  ADD COLUMN razorpay_payment_id VARCHAR(120) DEFAULT NULL AFTER razorpay_order_id,
  ADD COLUMN razorpay_signature VARCHAR(255) DEFAULT NULL AFTER razorpay_payment_id,
  ADD COLUMN paid_at DATETIME DEFAULT NULL AFTER razorpay_signature,
  ADD KEY idx_orders_razorpay_order_id (razorpay_order_id);
