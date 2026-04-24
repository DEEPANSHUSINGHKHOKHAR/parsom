const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');

const { query } = require('../../config/db');
const env = require('../../config/env');
const AppError = require('../../utils/app-error');

function csvEscape(value) {
  if (value === null || value === undefined) return '';
  const text = String(value).replace(/"/g, '""');
  if (/[",\n]/.test(text)) return `"${text}"`;
  return text;
}

function buildCsv(rows, headers) {
  const headerLine = headers.map((header) => csvEscape(header.label)).join(',');
  const bodyLines = rows.map((row) =>
    headers.map((header) => csvEscape(row[header.key])).join(',')
  );
  return [headerLine, ...bodyLines].join('\n');
}

async function exportOrdersCsv() {
  const rows = await query(
    `
      SELECT
        order_number AS orderNumber,
        customer_name AS customerName,
        customer_email AS customerEmail,
        customer_phone AS customerPhone,
        order_status AS status,
        payment_status AS paymentStatus,
        subtotal_amount AS subtotal,
        discount_amount AS discountAmount,
        total_amount AS totalAmount,
        ordered_at AS placedAt
      FROM orders
      WHERE deleted_at IS NULL
      ORDER BY created_at DESC
    `
  );

  return buildCsv(rows, [
    { key: 'orderNumber', label: 'Order Number' },
    { key: 'customerName', label: 'Customer Name' },
    { key: 'customerEmail', label: 'Email' },
    { key: 'customerPhone', label: 'Phone' },
    { key: 'status', label: 'Status' },
    { key: 'paymentStatus', label: 'Payment Status' },
    { key: 'subtotal', label: 'Subtotal' },
    { key: 'discountAmount', label: 'Discount Amount' },
    { key: 'totalAmount', label: 'Total Amount' },
    { key: 'placedAt', label: 'Placed At' },
  ]);
}

async function exportNotifyRequestsCsv() {
  const rows = await query(
    `
      SELECT
        nr.id,
        nr.requester_name AS fullName,
        nr.requester_email AS email,
        nr.requester_phone AS phone,
        pv.size_code AS size,
        nr.status,
        nr.created_at AS createdAt,
        p.name AS productName
      FROM notify_requests nr
      INNER JOIN products p
        ON p.id = nr.product_id
      LEFT JOIN product_variants pv
        ON pv.id = nr.product_variant_id
      WHERE nr.deleted_at IS NULL
      ORDER BY nr.created_at DESC
    `
  );

  return buildCsv(rows, [
    { key: 'id', label: 'ID' },
    { key: 'fullName', label: 'Full Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'productName', label: 'Product Name' },
    { key: 'size', label: 'Size' },
    { key: 'status', label: 'Status' },
    { key: 'createdAt', label: 'Created At' },
  ]);
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function uploadMedia(file) {
  if (!file) {
    throw new AppError(422, 'File is required.');
  }

  const uploadsRoot = path.join(process.cwd(), 'uploads');
  const imagesDir = path.join(uploadsRoot, 'images');
  const videosDir = path.join(uploadsRoot, 'videos');

  await ensureDir(imagesDir);
  await ensureDir(videosDir);

  const baseName = `${Date.now()}-${crypto.randomUUID()}`;

  if (file.mimetype.startsWith('image/')) {
    const fileName = `${baseName}.webp`;
    const outputPath = path.join(imagesDir, fileName);

    await sharp(file.buffer)
      .rotate()
      .resize(1800, 1800, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 82 })
      .toFile(outputPath);

    const relativePath = `/uploads/images/${fileName}`;

    return {
      type: 'image',
      url: `${env.APP_URL}${relativePath}`,
      relativePath,
    };
  }

  if (file.mimetype.startsWith('video/')) {
    const extension = path.extname(file.originalname || '') || '.mp4';
    const fileName = `${baseName}${extension}`;
    const outputPath = path.join(videosDir, fileName);

    await fs.writeFile(outputPath, file.buffer);

    const relativePath = `/uploads/videos/${fileName}`;

    return {
      type: 'video',
      url: `${env.APP_URL}${relativePath}`,
      relativePath,
    };
  }

  throw new AppError(422, 'Only image and video uploads are supported.');
}

module.exports = {
  exportOrdersCsv,
  exportNotifyRequestsCsv,
  uploadMedia,
};
