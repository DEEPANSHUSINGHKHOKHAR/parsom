const crypto = require('crypto');
const sharp = require('sharp');

const { query } = require('../../config/db');
const env = require('../../config/env');
const AppError = require('../../utils/app-error');
const { uploadBuffer } = require('../../utils/cloudinary-client');
const { validateUploadedMedia } = require('../../utils/media-validation');

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

async function uploadMedia(file) {
  const media = validateUploadedMedia(file);

  const baseName = `${Date.now()}-${crypto.randomUUID()}`;

  if (media.type === 'image') {
    const image = sharp(file.buffer, { animated: true }).rotate();
    const metadata = await image.metadata();

    const outputBuffer = await image
      .resize(1800, 1800, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 82 })
      .toBuffer();
    const cloudinaryResult = await uploadBuffer(outputBuffer, {
      folder: `${env.CLOUDINARY_FOLDER}/images`,
      public_id: baseName,
      resource_type: 'image',
      format: 'webp',
      overwrite: false,
    });

    return {
      type: 'image',
      url: cloudinaryResult.secure_url,
      relativePath: cloudinaryResult.public_id,
      publicId: cloudinaryResult.public_id,
      originalName: file.originalname,
      mimeType: file.mimetype,
      originalFormat: metadata.format || null,
      width: metadata.width || null,
      height: metadata.height || null,
      outputFormat: 'webp',
      outputMaxResolution: '1800x1800',
      sizeBytes: file.size,
    };
  }

  if (media.type === 'video') {
    const cloudinaryResult = await uploadBuffer(file.buffer, {
      folder: `${env.CLOUDINARY_FOLDER}/videos`,
      public_id: baseName,
      resource_type: 'video',
      overwrite: false,
    });

    return {
      type: 'video',
      url: cloudinaryResult.secure_url,
      relativePath: cloudinaryResult.public_id,
      publicId: cloudinaryResult.public_id,
      originalName: file.originalname,
      mimeType: file.mimetype,
      originalFormat:
        cloudinaryResult.format || media.extension.replace('.', '').toLowerCase(),
      sizeBytes: file.size,
    };
  }

  throw new AppError(422, 'Only image and video uploads are supported.');
}

module.exports = {
  exportOrdersCsv,
  exportNotifyRequestsCsv,
  uploadMedia,
};
