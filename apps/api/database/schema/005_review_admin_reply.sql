USE parsom_brand;

ALTER TABLE reviews
  ADD COLUMN admin_reply TEXT DEFAULT NULL AFTER image_path;
