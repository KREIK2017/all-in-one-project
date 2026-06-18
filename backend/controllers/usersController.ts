import usersService from '../services/usersService';
import asyncHandler from '../utils/asyncHandler';
import AppError from '../utils/AppError';

export const list = asyncHandler(async (_req, res) => {
  res.json(await usersService.list());
});

export const remove = asyncHandler(async (req, res) => {
  await usersService.remove(String(req.params.id), req.user!);
  res.json({ success: true });
});

export const changeRole = asyncHandler(async (req, res) => {
  const result = await usersService.changeRole(req.user!, String(req.params.id), req.body.role);
  res.json({ success: true, ...result });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const user = await usersService.updateProfile(req.user!.id, req.body);
  res.json({ success: true, user });
});

export const checkHandle = asyncHandler(async (req, res) => {
  res.json(await usersService.isHandleAvailable(String(req.params.handle)));
});

export const getProfile = asyncHandler(async (req, res) => {
  res.json(await usersService.getProfileWithStats(String(req.params.id)));
});

export const changePassword = asyncHandler(async (req, res) => {
  await usersService.changePassword(req.user!.id, {
    oldPassword: req.body.oldPassword,
    newPassword: req.body.newPassword,
  });
  res.json({ success: true, message: 'Пароль успішно змінено' });
});

export const updateStatus = asyncHandler(async (req, res) => {
  await usersService.updateStatus(req.user!.id, req.body.status);
  res.json({ success: true, status: req.body.status });
});

export const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError(400, 'No file uploaded');
  const avatar_url = await usersService.setAvatar(req.user!.id, req.file.filename);
  res.json({ success: true, avatar_url });
});

export const deleteAvatar = asyncHandler(async (req, res) => {
  await usersService.removeAvatar(req.user!.id);
  res.json({ success: true, message: 'Avatar deleted' });
});
