const config = require('./config/env');
const connectDB = require('./config/db');
const app = require('./app');
const logger = require('./utils/logger');

(async () => {
  try {
    await connectDB();
    app.listen(config.port, () => logger.info(`API running on port ${config.port} (${config.nodeEnv})`));
  } catch (err) {
    logger.error('Failed to start server', { message: err.message });
    process.exit(1);
  }
})();

process.on('unhandledRejection', (err) => logger.error('Unhandled rejection', { message: err?.message, stack: err?.stack }));
