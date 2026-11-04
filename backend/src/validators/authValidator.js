const { z } = require('zod');

const email = z.string().trim().toLowerCase().email('Enter a valid email');
exports.password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password is too long')
  .regex(/[A-Za-z]/, 'Password must contain a letter')
  .regex(/\d/, 'Password must contain a number');

// No "role" field here: public signup can only ever create employees
exports.register = z.object({
  name: z.string().trim().min(2, 'Name is too short').max(60),
  email,
  password: exports.password,
});

exports.login = z.object({ email, password: z.string().min(1, 'Password is required') });
