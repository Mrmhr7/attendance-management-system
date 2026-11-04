const User = require('../models/User');
const ApiError = require('../utils/ApiError');

exports.teamEmployeeIds = async (manager) => {
  const team = await User.find({ managerId: manager._id }).select('_id');
  return team.map((u) => u._id);
};

// Mongo filter limiting records to what this user may see (field = the employee reference field)
exports.scopeFilter = async (user, field = 'employeeId') => {
  if (user.role === 'admin') return {};
  if (user.role === 'manager') return { [field]: { $in: await exports.teamEmployeeIds(user) } };
  return { [field]: user._id };
};

// Can `user` access data that belongs to `employeeId`?
exports.canAccessEmployee = async (user, employeeId) => {
  const id = String(employeeId?._id || employeeId);
  if (user.role === 'admin') return true;
  if (String(user._id) === id) return true;
  if (user.role === 'manager') return Boolean(await User.exists({ _id: id, managerId: user._id }));
  return false;
};

exports.assertCanAccessEmployee = async (user, employeeId) => {
  if (!(await exports.canAccessEmployee(user, employeeId))) {
    throw new ApiError(403, 'You do not have access to this employee\'s records');
  }
};
