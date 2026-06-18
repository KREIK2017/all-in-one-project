import statsService from '../services/statsService';
import asyncHandler from '../utils/asyncHandler';

export const dashboard = asyncHandler(async (_req, res) => {
  res.json(await statsService.getDashboard());
});
