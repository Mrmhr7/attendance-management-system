const fs = require('fs');
const path = require('path');
const winston = require('winston');

const isProd = process.env.NODE_ENV === 'production';
const transports = [
  new winston.transports.Console({
    format: isProd
      ? winston.format.json()
      : winston.format.combine(winston.format.colorize(), winston.format.simple()),
  }),
];

if (!isProd) {
  const dir = path.join(__dirname, '../../logs');
  fs.mkdirSync(dir, { recursive: true });
  transports.push(
    new winston.transports.File({ filename: path.join(dir, 'error.log'), level: 'error' }),
    new winston.transports.File({ filename: path.join(dir, 'combined.log') })
  );
}

module.exports = winston.createLogger({
  level: isProd ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports,
});
