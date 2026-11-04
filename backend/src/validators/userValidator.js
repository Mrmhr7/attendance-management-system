const { z } = require('zod');
const { objectId, pagination } = require('./common');
const { password } = require('./authValidator');

const base = {
  name: z.string().trim().min(2).max(60),
  email: z.string().trim().toLowerCase().email(),
  password,
  role: z.enum(['employee', 'manager', 'admin']),
  managerId: objectId.nullable(),
  isActive: z.boolean(),
};

exports.createUser = z.object({
  name: base.name,
  email: base.email,
  password: base.password,
  role: base.role,
  managerId: base.managerId.optional(),
  isActive: base.isActive.optional(),
});

exports.updateUser = z.object(base).partial();

exports.listUsers = z.object({
  ...pagination,
  role: base.role.optional(),
  search: z.string().trim().max(60).optional(),
  isActive: z.enum(['true', 'false']).optional(),
});

// Dedicated activate/deactivate action (separate from the general update)
exports.updateStatus = z.object({ isActive: base.isActive });

// Dedicated "assign employee to manager" action. managerId: null unassigns.
exports.assignManager = z.object({ managerId: base.managerId });