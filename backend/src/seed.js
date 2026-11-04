// Usage: npm run seed   (safe to re-run; existing seeded emails are skipped)
const config = require('./config/env');
const connectDB = require('./config/db');
const User = require('./models/User');
const logger = require('./utils/logger');

const ensure = async (data) => {
  const existing = await User.findOne({ email: data.email });
  if (existing) return existing;
  return User.create(data);
};

(async () => {
  await connectDB();
  const admin = await ensure({ name: 'Alex Admin', email: 'admin@example.com', password: 'Admin@123', role: 'admin' });
  const manager = await ensure({ name: 'Maya Manager', email: 'manager@example.com', password: 'Manager@123', role: 'manager' });
  await ensure({ name: 'Eli Employee', email: 'employee@example.com', password: 'Employee@123', role: 'employee', managerId: manager._id });
  await ensure({ name: 'Priya Employee', email: 'employee2@example.com', password: 'Employee@123', role: 'employee', managerId: manager._id });
  logger.info(`Seed complete (admin: ${admin.email}, env: ${config.nodeEnv})`);
  process.exit(0);
})().catch((err) => {
  logger.error('Seed failed', { message: err.message });
  process.exit(1);
});
