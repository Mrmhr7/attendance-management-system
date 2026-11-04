const config = require('../config/env');

// Returns YYYY-MM-DD for the given instant in the configured business timezone.
exports.dateString = (d = new Date()) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: config.timezone }).format(d);

exports.round2 = (n) => Math.round(n * 100) / 100;
exports.hoursBetween = (from, to) => exports.round2((to - from) / 3600000);
