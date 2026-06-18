import notificationsService from '../services/notificationsService';
import asyncHandler from '../utils/asyncHandler';

export const list = asyncHandler(async (req, res) => {
  res.json(await notificationsService.listForUser(req.user!.id));
});

export const unreadCount = asyncHandler(async (req, res) => {
  res.json({ count: await notificationsService.unreadCount(req.user!.id) });
});

export const markRead = asyncHandler(async (req, res) => {
  await notificationsService.markRead(String(req.params.id), req.user!.id);
  res.json({ success: true });
});

export const markAllRead = asyncHandler(async (req, res) => {
  await notificationsService.markAllRead(req.user!.id);
  res.json({ success: true });
});
