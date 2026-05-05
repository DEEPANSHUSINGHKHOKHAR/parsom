const path = require('path');
const AppError = require('../utils/app-error');

const imageMimeTypes = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
};

const videoMimeTypes = {
  'video/mp4': ['.mp4'],
  'video/webm': ['.webm'],
};

function normalizeMimeType(mime) {
  if (mime === 'image/jpg') return 'image/jpeg';
  return mime;
}

function getFileExtension(filename) {
  return path.extname(filename || '').toLowerCase();
}

function detectMagic(buffer) {
  if (!buffer || buffer.length < 12) return null;

  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png';
  }

  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  if (
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38
  ) {
    return 'image/gif';
  }

  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return 'image/webp';
  }

  if (buffer[4] === 0x66 && buffer[5] === 0x74 && buffer[6] === 0x79 && buffer[7] === 0x70) {
    return 'video/mp4';
  }

  if (
    buffer[0] === 0x1a &&
    buffer[1] === 0x45 &&
    buffer[2] === 0xdf &&
    buffer[3] === 0xa3
  ) {
    return 'video/webm';
  }

  return null;
}

function validateFile(file, allowedMimeTypes, kindLabel) {
  if (!file) {
    throw new AppError(422, `${kindLabel} upload is required.`);
  }

  const mimeType = normalizeMimeType(file.mimetype || '');
  const allowedExtensions = allowedMimeTypes[mimeType] || [];
  const extension = getFileExtension(file.originalname);

  if (!allowedExtensions.includes(extension)) {
    throw new AppError(422, `Unsupported ${kindLabel} file extension.`);
  }

  const detectedType = detectMagic(file.buffer);

  if (!detectedType || normalizeMimeType(detectedType) !== mimeType) {
    throw new AppError(422, `Unsupported ${kindLabel} file content.`);
  }
}

function validateImageUpload(req, res, next) {
  try {
    validateFile(req.file, imageMimeTypes, 'image');
    next();
  } catch (error) {
    next(error);
  }
}

function validateMediaUpload(req, res, next) {
  try {
    const allowed = { ...imageMimeTypes, ...videoMimeTypes };
    validateFile(req.file, allowed, 'media');
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  validateImageUpload,
  validateMediaUpload,
};
