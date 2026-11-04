const fs = require('fs');
const path = require('path');
const cloudinary = require('../config/cloudinary');
const config = require('../config/env');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

const PREFIX = /^data:image\/(jpeg|png|webp);base64,/;
const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Stores a base64 selfie captured from the live camera and returns its URL.
 * Cloudinary is used when configured; in local dev it falls back to backend/uploads.
 */
exports.saveSelfie = async (dataUri, employeeId, kind) => {
  const match = PREFIX.exec(dataUri);
  if (!match) throw new ApiError(400, 'Selfie must be a base64-encoded JPEG, PNG or WebP image');

  const buffer = Buffer.from(dataUri.slice(match[0].length), 'base64');
  if (buffer.length < 1000) throw new ApiError(400, 'Selfie image looks empty');
  if (buffer.length > MAX_BYTES) throw new ApiError(413, 'Selfie image is too large (max 5 MB)');

  const publicId = `${employeeId}_${kind}_${Date.now()}`;

  if (cloudinary.enabled) {
    try {
      const result = await cloudinary.client.uploader.upload(dataUri, {
        folder: config.cloudinary.folder,
        public_id: publicId,
        resource_type: 'image',
      });
      return result.secure_url;
    } catch (err) {
      logger.error('Cloudinary upload failed', { message: err.message });
      throw new ApiError(502, 'Could not store the selfie, please try again');
    }
  }

  if (config.isProd) throw new ApiError(500, 'Image storage is not configured');

  const dir = path.join(__dirname, '../../uploads');
  fs.mkdirSync(dir, { recursive: true });
  const file = `${publicId}.${match[1] === 'jpeg' ? 'jpg' : match[1]}`;
  fs.writeFileSync(path.join(dir, file), buffer);
  logger.warn('Cloudinary not configured: selfie saved locally (development only)');
  return `${config.backendUrl}/uploads/${file}`;
};
