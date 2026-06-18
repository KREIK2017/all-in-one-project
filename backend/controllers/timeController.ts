import timeService from '../services/timeService';
import asyncHandler from '../utils/asyncHandler';

export const billing = asyncHandler(async (req, res) => {
  const { start, end, user_id } = req.query as { start?: string; end?: string; user_id?: string };
  // Адмін може фільтрувати по будь-кому; звичайний юзер бачить лише свій час
  const userId = req.user!.role === 'admin' ? user_id : String(req.user!.id);
  res.json(await timeService.getBilling({ start, end, userId }));
});

export const start = asyncHandler(async (req, res) => {
  const { project_id, ticket_id, description } = req.body;
  const result = await timeService.start({
    userId: req.user!.id,
    projectId: project_id,
    ticketId: ticket_id,
    description,
  });
  res.json({ success: true, ...result });
});

export const stop = asyncHandler(async (req, res) => {
  const result = await timeService.stop(req.user!.id);
  res.json({ success: true, ...result });
});

export const active = asyncHandler(async (req, res) => {
  // Завжди свій таймер (з токена), параметр URL ігнорується
  res.json(await timeService.getActiveTimer(String(req.user!.id)));
});

export const manual = asyncHandler(async (req, res) => {
  const { project_id, ticket_id, duration_minutes, description } = req.body;
  const result = await timeService.addManual({
    userId: req.user!.id,
    projectId: project_id,
    ticketId: ticket_id,
    durationMinutes: duration_minutes,
    description,
  });
  res.status(201).json({ success: true, ...result });
});

export const editEntry = asyncHandler(async (req, res) => {
  await timeService.editEntry(String(req.params.id), {
    durationMinutes: req.body.duration_minutes,
    userId: req.user!.id,
  });
  res.json({ success: true });
});
