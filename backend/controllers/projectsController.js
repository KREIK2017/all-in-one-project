const projectsService = require('../services/projectsService');
const asyncHandler = require('../utils/asyncHandler');

exports.list = asyncHandler(async (req, res) => {
  res.json(await projectsService.list());
});

exports.create = asyncHandler(async (req, res) => {
  const project = await projectsService.create(req.body);
  res.status(201).json(project);
});

exports.remove = asyncHandler(async (req, res) => {
  await projectsService.remove(req.params.id);
  res.json({ success: true });
});
