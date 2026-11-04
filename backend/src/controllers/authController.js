const jwt = require('jsonwebtoken');
const config = require('../config/env');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');

const signToken = (id) => jwt.sign({ id }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });

exports.register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (await User.exists({ email })) throw new ApiError(409, 'Email is already registered');

  const user = await User.create({ name, email, password, role: 'employee' }); // role is always employee
  sendSuccess(res, { token: signToken(user._id), user }, 'Registration successful', 201);
});

exports.login = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email }).select('+password');
  if (!user || !(await user.comparePassword(req.body.password))) {
    throw new ApiError(401, 'Invalid email or password');
  }
  if (!user.isActive) throw new ApiError(403, 'Your account has been deactivated');

  sendSuccess(res, { token: signToken(user._id), user }, 'Login successful');
});

exports.me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('managerId', 'name email');
  sendSuccess(res, user);
});
