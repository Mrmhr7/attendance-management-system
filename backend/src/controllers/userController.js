const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const { getPagination, buildMeta, escapeRegex } = require('../utils/pagination');
const { canAccessEmployee } = require('../services/accessService');

const resolveManager = async (managerId) => {
  if (!managerId) return null;
  const manager = await User.findOne({ _id: managerId, role: 'manager', isActive: true });
  if (!manager) throw new ApiError(400, 'managerId must reference an active manager');
  return manager._id;
};

exports.list = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};
  if (req.user.role === 'manager') filter.managerId = req.user._id; // managers only see their team
  if (req.query.role) filter.role = req.query.role;
  if (req.query.isActive) filter.isActive = req.query.isActive === 'true';
  if (req.query.search) {
    const rx = new RegExp(escapeRegex(req.query.search), 'i');
    filter.$or = [{ name: rx }, { email: rx }];
  }

  const [users, total] = await Promise.all([
    User.find(filter).populate('managerId', 'name email').sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);
  sendSuccess(res, users, 'Users fetched', 200, buildMeta(page, limit, total));
});

exports.getById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).populate('managerId', 'name email');
  if (!user) throw new ApiError(404, 'User not found');
  if (!(await canAccessEmployee(req.user, user._id))) throw new ApiError(403, 'Access denied');
  sendSuccess(res, user);
});

exports.create = asyncHandler(async (req, res) => {
  const { name, email, password, role, isActive } = req.body;
  if (await User.exists({ email })) throw new ApiError(409, 'Email is already registered');

  const managerId = role === 'employee' ? await resolveManager(req.body.managerId) : null;
  const user = await User.create({ name, email, password, role, managerId, isActive: isActive ?? true });
  sendSuccess(res, user, 'User created', 201);
});

exports.update = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');

  const { name, email, password, role, managerId, isActive } = req.body;
  const isSelf = String(user._id) === String(req.user._id);
  if (isSelf && (isActive === false || (role && role !== 'admin'))) {
    throw new ApiError(400, 'You cannot deactivate or demote your own account');
  }
  if (email && email !== user.email && (await User.exists({ email }))) {
    throw new ApiError(409, 'Email is already registered');
  }

  const wasManager = user.role === 'manager';
  if (name !== undefined) user.name = name;
  if (email !== undefined) user.email = email;
  if (password !== undefined) user.password = password; // hashed by the pre-save hook
  if (role !== undefined) user.role = role;
  if (isActive !== undefined) user.isActive = isActive;

  if (user.role !== 'employee') user.managerId = null;
  else if (managerId !== undefined) user.managerId = await resolveManager(managerId);

  await user.save();
  if (wasManager && (user.role !== 'manager' || !user.isActive)) {
    await User.updateMany({ managerId: user._id }, { $set: { managerId: null } });
  }
  sendSuccess(res, user, 'User updated');
});

// Dedicated activate/deactivate action — same safety checks as update(), without requiring
// name/email/role/password to be resent just to flip one flag.
exports.updateStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  if (String(user._id) === String(req.user._id) && req.body.isActive === false) {
    throw new ApiError(400, 'You cannot deactivate your own account');
  }

  user.isActive = req.body.isActive;
  await user.save();

  if (user.role === 'manager' && !user.isActive) {
    await User.updateMany({ managerId: user._id }, { $set: { managerId: null } });
  }
  sendSuccess(res, user, user.isActive ? 'User activated' : 'User deactivated');
});

// Dedicated "assign employee to manager" action, so reassigning doesn't require the full edit form.
exports.assignManager = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  if (user.role !== 'employee') throw new ApiError(400, 'Only employees can be assigned to a manager');

  user.managerId = await resolveManager(req.body.managerId);
  await user.save();
  await user.populate('managerId', 'name email');
  sendSuccess(res, user, 'Manager assignment updated');
});

// Soft delete: attendance history must stay intact, so the account is deactivated
exports.remove = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  if (String(user._id) === String(req.user._id)) throw new ApiError(400, 'You cannot deactivate your own account');

  user.isActive = false;
  await user.save();
  await User.updateMany({ managerId: user._id }, { $set: { managerId: null } });
  sendSuccess(res, user, 'User deactivated');
});