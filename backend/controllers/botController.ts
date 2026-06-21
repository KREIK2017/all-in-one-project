import * as bot from '../bot';
import asyncHandler from '../utils/asyncHandler';
import AppError from '../utils/AppError';

function ensureAdmin(role?: string) {
  if (role !== 'admin') throw new AppError(403, 'Доступ заборонено');
}

export const status = asyncHandler(async (_req, res) => {
  res.json(bot.getBotStatus());
});

export const start = asyncHandler(async (req, res) => {
  ensureAdmin(req.user!.role);
  const ticketId = Number(req.body.ticketId);
  if (!ticketId) throw new AppError(400, 'ticketId обовʼязковий');
  res.json(await bot.startBot(ticketId));
});

export const stop = asyncHandler(async (req, res) => {
  ensureAdmin(req.user!.role);
  res.json(await bot.stopBot());
});
