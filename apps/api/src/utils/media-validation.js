const path = require('path');
const AppError = require('./app-error');

const allowedImageTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
]);

const allowedVideoTypes = new Set([
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-m4v',
]);

const allowedVideoExtensions = new Set(['.mp4', '.webm', '.mov', '.m4v']);

function hasImageSignature(buffer) {
  if (!buffer || buffer.length < 12) return false;

  const hex = buffer.subarray(0, 12).toString('hex');
  const ascii = buffer.subarray(0, 12).toString('ascii');

  return (
    hex.startsWith('ffd8ff') ||
    hex.startsWith('89504e470d0a1a0a') ||
    ascii.startsWith('RIFF') ||
    ascii.startsWith('GIF8') ||
    ascii.includes('ftypavif')
  );
}

function hasVideoSignature(buffer, extension) {
  if (!buffer || buffer.length < 12) return false;

  const ascii = buffer.subarray(0, 32).toString('ascii');

  if (extension === '.webm') {
    return buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3;
  }

  return ascii.includes('ftyp') || ascii.includes('moov') || ascii.includes('mdat');
}

function validateUploadedMedia(file) {
  if (!file) {
    throw new AppError(422, 'Media file is required.');
  }

  const extension = path.extname(file.originalname || '').toLowerCase();

  if (file.mimetype.startsWith('image/')) {
    if (!allowedImageTypes.has(file.mimetype) || !hasImageSignature(file.buffer)) {
      throw new AppError(422, 'Unsupported or invalid image file.');
    }

    return {
      type: 'image',
      extension,
    };
  }

  if (file.mimetype.startsWith('video/')) {
    if (
      !allowedVideoTypes.has(file.mimetype) ||
      !allowedVideoExtensions.has(extension) ||
      !hasVideoSignature(file.buffer, extension)
    ) {
      throw new AppError(422, 'Unsupported or invalid video file.');
    }

    return {
      type: 'video',
      extension,
    };
  }

  throw new AppError(422, 'Only image and video uploads are supported.');
}

module.exports = {
  validateUploadedMedia,
};
