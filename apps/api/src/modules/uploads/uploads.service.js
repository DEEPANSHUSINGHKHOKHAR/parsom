const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');
const env = require('../../config/env');
const { uploadsRoot } = require('../../config/paths');
const { validateUploadedMedia } = require('../../utils/media-validation');
const AppError = require('../../utils/app-error');

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function uploadReviewImage(file) {
  const media = validateUploadedMedia(file);

  const reviewsDir = path.join(uploadsRoot, 'reviews');

  await ensureDir(reviewsDir);

  const baseName = `${Date.now()}-${crypto.randomUUID()}`;

  if (media.type === 'image') {
    const image = sharp(file.buffer).rotate();
    const metadata = await image.metadata();
    const fileName = `${baseName}.webp`;
    const outputPath = path.join(reviewsDir, fileName);

    await image
      .resize(1200, 1200, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 72, effort: 5 })
      .toFile(outputPath);

    const outputStats = await fs.stat(outputPath);

    const relativePath = `/uploads/reviews/${fileName}`;

    return {
      type: 'image',
      url: `${env.APP_URL}${relativePath}`,
      relativePath,
      originalName: file.originalname,
      mimeType: file.mimetype,
      originalFormat: metadata.format || null,
      width: metadata.width || null,
      height: metadata.height || null,
      sizeBytes: file.size,
      compressedSizeBytes: outputStats.size,
      outputFormat: 'webp',
      outputMaxResolution: '1200x1200',
    };
  }

  throw new AppError(422, 'Only image uploads are supported for reviews.');
}

module.exports = {
  uploadReviewImage,
};
