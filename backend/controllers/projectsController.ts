import projectsService from '../services/projectsService';
import asyncHandler from '../utils/asyncHandler';

export const list = asyncHandler(async (_req, res) => {
  res.json(await projectsService.list());
});

export const create = asyncHandler(async (req, res) => {
  const project = await projectsService.create(req.body);
  res.status(201).json(project);
});

export const remove = asyncHandler(async (req, res) => {
  await projectsService.remove(String(req.params.id));
  res.json({ success: true });
});
