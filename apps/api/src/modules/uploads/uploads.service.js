const crypto = require('crypto');
const sharp = require('sharp');
const env = require('../../config/env');
const { uploadBuffer } = require('../../utils/cloudinary-client');
const { validateUploadedMedia } = require('../../utils/media-validation');
const AppError = require('../../utils/app-error');

async function uploadReviewImage(file) {
  const media = validateUploadedMedia(file);

  const baseName = `${Date.now()}-${crypto.randomUUID()}`;

  if (media.type === 'image') {
    const image = sharp(file.buffer).rotate();
    const metadata = await image.metadata();

    const outputBuffer = await image
      .resize(1200, 1200, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 72, effort: 5 })
      .toBuffer();
    const cloudinaryResult = await uploadBuffer(outputBuffer, {
      folder: `${env.CLOUDINARY_FOLDER}/reviews`,
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
      sizeBytes: file.size,
      compressedSizeBytes: cloudinaryResult.bytes || outputBuffer.length,
      outputFormat: 'webp',
      outputMaxResolution: '1200x1200',
    };
  }

  throw new AppError(422, 'Only image uploads are supported for reviews.');
}

module.exports = {
  uploadReviewImage,
};
