import ticketsService from '../services/ticketsService';
import asyncHandler from '../utils/asyncHandler';

export const list = asyncHandler(async (req, res) => {
  const tickets = await ticketsService.list({
    user: req.user!,
    projectId: req.query.projectId as string | undefined,
  });
  res.json(tickets);
});

export const getOne = asyncHandler(async (req, res) => {
  res.json(await ticketsService.getOne(String(req.params.id)));
});

export const create = asyncHandler(async (req, res) => {
  const id = await ticketsService.create(req.body);
  res.status(201).json({ id });
});

export const addComment = asyncHandler(async (req, res) => {
  await ticketsService.addComment(String(req.params.id), { userId: req.body.user_id, content: req.body.content });
  res.status(201).json({ success: true });
});

export const update = asyncHandler(async (req, res) => {
  await ticketsService.update(String(req.params.id), req.body);
  res.json({ success: true });
});

export const remove = asyncHandler(async (req, res) => {
  await ticketsService.remove(String(req.params.id));
  res.json({ success: true });
});
