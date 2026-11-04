const { v2: cloudinary } = require('cloudinary');
const config = require('./env');

const { cloudName, apiKey, apiSecret } = config.cloudinary;
const enabled = Boolean(cloudName && apiKey && apiSecret);

if (enabled) {
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });
}

module.exports = { client: cloudinary, enabled };
