import authService from '../services/authService';
import asyncHandler from '../utils/asyncHandler';

export const register = asyncHandler(async (req, res) => {
  res.status(201).json(await authService.register(req.body));
});

export const login = asyncHandler(async (req, res) => {
  res.json(await authService.login(req.body));
});

export const me = asyncHandler(async (req, res) => {
  const token = req.headers['authorization']?.split(' ')[1];
  res.json(await authService.me(token));
});
