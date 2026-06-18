import timeService from '../services/timeService';
import asyncHandler from '../utils/asyncHandler';

export const billing = asyncHandler(async (req, res) => {
  const { start, end, user_id } = req.query as { start?: string; end?: string; user_id?: string };
  res.json(await timeService.getBilling({ start, end, userId: user_id }));
});

export const start = asyncHandler(async (req, res) => {
  const { user_id, project_id, ticket_id, description } = req.body;
  const result = await timeService.start({
    userId: user_id,
    projectId: project_id,
    ticketId: ticket_id,
    description,
  });
  res.json({ success: true, ...result });
});

export const stop = asyncHandler(async (req, res) => {
  const result = await timeService.stop(req.body.user_id);
  res.json({ success: true, ...result });
});

export const active = asyncHandler(async (req, res) => {
  res.json(await timeService.getActiveTimer(String(req.params.user_id)));
});

export const manual = asyncHandler(async (req, res) => {
  const { user_id, project_id, ticket_id, duration_minutes, description } = req.body;
  const result = await timeService.addManual({
    userId: user_id,
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
    userId: req.body.user_id,
  });
  res.json({ success: true });
});
