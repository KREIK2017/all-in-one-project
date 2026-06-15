const statsService = require('../services/statsService');
const asyncHandler = require('../utils/asyncHandler');

exports.dashboard = asyncHandler(async (req, res) => {
  res.json(await statsService.getDashboard());
});
