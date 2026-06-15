const authService = require('../services/authService');
const asyncHandler = require('../utils/asyncHandler');

exports.register = asyncHandler(async (req, res) => {
  res.status(201).json(await authService.register(req.body));
});

exports.login = asyncHandler(async (req, res) => {
  res.json(await authService.login(req.body));
});

exports.me = asyncHandler(async (req, res) => {
  const token = req.headers['authorization']?.split(' ')[1];
  res.json(await authService.me(token));
});
