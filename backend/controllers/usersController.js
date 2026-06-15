const usersService = require('../services/usersService');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

exports.list = asyncHandler(async (req, res) => {
  const users = await usersService.list();
  res.json(users);
});

exports.remove = asyncHandler(async (req, res) => {
  await usersService.remove(req.params.id, req.user);
  res.json({ success: true });
});
exports.changeRole = asyncHandler(async (req, res) => {
  const result = await usersService.changeRole(req.user, req.params.id, req.body.role);
  res.json({ success: true, ...result });
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const user = await usersService.updateProfile(req.user.id, req.body);
  res.json({ success: true, user });
});

exports.checkHandle = asyncHandler(async (req, res) => {
  res.json(await usersService.isHandleAvailable(req.params.handle));
});

exports.getProfile = asyncHandler(async (req, res) => {
  res.json(await usersService.getProfileWithStats(req.params.id));
});

exports.changePassword = asyncHandler(async (req, res) => {
  await usersService.changePassword(req.user.id, { oldPassword: req.body.oldPassword, newPassword: req.body.newPassword });
  res.json({ success: true, message: 'Пароль успішно змінено' });
});

exports.updateStatus = asyncHandler(async (req, res) => {
  await usersService.updateStatus(req.user.id, req.body.status);
  res.json({ success: true, status: req.body.status });
});

exports.uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError(400, 'No file uploaded');
  const avatar_url = await usersService.setAvatar(req.user.id, req.file.filename);
  res.json({ success: true, avatar_url });
});

exports.deleteAvatar = asyncHandler(async (req, res) => {
  await usersService.removeAvatar(req.user.id);
  res.json({ success: true, message: 'Avatar deleted' });
});

