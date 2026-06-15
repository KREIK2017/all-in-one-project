const notificationsService = require('../services/notificationsService');
const asyncHandler = require('../utils/asyncHandler');

exports.list = asyncHandler(async (req, res) => {
  res.json(await notificationsService.listForUser(req.user.id));
});

exports.unreadCount = asyncHandler(async (req, res) => {
  res.json({ count: await notificationsService.unreadCount(req.user.id) });
});

exports.markRead = asyncHandler(async (req, res) => {
  await notificationsService.markRead(req.params.id, req.user.id);
  res.json({ success: true });
});

exports.markAllRead = asyncHandler(async (req, res) => {
  await notificationsService.markAllRead(req.user.id);
  res.json({ success: true });
});
