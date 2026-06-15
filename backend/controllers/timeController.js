const timeService = require('../services/timeService');
const asyncHandler = require('../utils/asyncHandler');

exports.billing = asyncHandler(async (req, res) => {
  const { start, end, user_id } = req.query;
  res.json(await timeService.getBilling({ start, end, userId: user_id }));
});

exports.start = asyncHandler(async (req, res) => {
  const { user_id, project_id, ticket_id, description } = req.body;
  const result = await timeService.start({ userId: user_id, projectId: project_id, ticketId: ticket_id, description });
  res.json({ success: true, ...result });
});

exports.stop = asyncHandler(async (req, res) => {
  const result = await timeService.stop(req.body.user_id);
  res.json({ success: true, ...result });
});

exports.active = asyncHandler(async (req, res) => {
  res.json(await timeService.getActiveTimer(req.params.user_id));
});

exports.manual = asyncHandler(async (req, res) => {
  const { user_id, project_id, ticket_id, duration_minutes, description } = req.body;
  const result = await timeService.addManual({ userId: user_id, projectId: project_id, ticketId: ticket_id, durationMinutes: duration_minutes, description });
  res.status(201).json({ success: true, ...result });
});

exports.editEntry = asyncHandler(async (req, res) => {
  await timeService.editEntry(req.params.id, { durationMinutes: req.body.duration_minutes, userId: req.body.user_id });
  res.json({ success: true });
});
