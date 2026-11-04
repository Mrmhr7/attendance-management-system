const mongoose = require('mongoose');
const config = require('./env');
const logger = require('../utils/logger');

module.exports = async function connectDB() {
  mongoose.set('strictQuery', true);
  await mongoose.connect(config.mongoUri);
  logger.info('MongoDB connected');
};
