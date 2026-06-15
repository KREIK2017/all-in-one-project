const ticketsService = require('../services/ticketsService');
const asyncHandler = require('../utils/asyncHandler');

exports.list = asyncHandler(async (req, res) => {
  const tickets = await ticketsService.list({ user: req.user, projectId: req.query.projectId });
  res.json(tickets);
});

exports.getOne = asyncHandler(async (req, res) => {
  res.json(await ticketsService.getOne(req.params.id));
});

exports.create = asyncHandler(async (req, res) => {
  const id = await ticketsService.create(req.body);
  res.status(201).json({ id });
});

exports.addComment = asyncHandler(async (req, res) => {
  await ticketsService.addComment(req.params.id, { userId: req.body.user_id, content: req.body.content });
  res.status(201).json({ success: true });
});

exports.update = asyncHandler(async (req, res) => {
  await ticketsService.update(req.params.id, req.body);
  res.json({ success: true });
});
