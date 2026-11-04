const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const config = require('./config/env');
const routes = require('./routes');
const requestLogger = require('./middleware/requestLogger');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.set('trust proxy', 1); // Render sits behind a proxy
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } })); // allow selfies to load on the frontend origin
app.use(
  cors({
    origin: (origin, cb) => (!origin || config.clientUrls.includes(origin) ? cb(null, true) : cb(new Error('Not allowed by CORS'))),
    credentials: true,
  })
);
app.use(express.json({ limit: '8mb' })); // selfies are sent as base64
app.use(requestLogger);
app.use(
  '/api',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 600,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please slow down' },
  })
);

app.get('/api/health', (_req, res) => res.json({ success: true, status: 'ok', uptime: process.uptime() }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads'))); // local-dev selfie fallback
app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
