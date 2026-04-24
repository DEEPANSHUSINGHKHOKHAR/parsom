const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');
const env = require('../../config/env');
const AppError = require('../../utils/app-error');

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function uploadReviewImage(file) {
  if (!file) {
    throw new AppError(422, 'Image file is required.');
  }

  if (!file.mimetype.startsWith('image/')) {
    throw new AppError(422, 'Only image uploads are allowed for reviews.');
  }

  const uploadsRoot = path.join(process.cwd(), 'uploads');
  const reviewsDir = path.join(uploadsRoot, 'reviews');

  await ensureDir(reviewsDir);

  const fileName = `${Date.now()}-${crypto.randomUUID()}.webp`;
  const outputPath = path.join(reviewsDir, fileName);

  await sharp(file.buffer)
    .rotate()
    .resize(1600, 1600, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: 82 })
    .toFile(outputPath);

  const relativePath = `/uploads/reviews/${fileName}`;

  return {
    url: `${env.APP_URL}${relativePath}`,
    relativePath,
  };
}

module.exports = {
  uploadReviewImage,
};