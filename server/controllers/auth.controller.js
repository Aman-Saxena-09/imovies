import bcrypt from 'bcryptjs';
import { z } from 'zod';
import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/errors.js';
import { cookieOptions, signToken } from '../middleware/auth.middleware.js';

export const registerSchema = z.object({ name: z.string().trim().min(2).max(80), email: z.string().trim().email().max(160), password: z.string().min(8).max(128) });
export const loginSchema = z.object({ email: z.string().trim().email(), password: z.string().min(1).max(128) });
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (await User.exists({ email: email.toLowerCase() })) throw new AppError('An account with this email already exists.', 409, 'EMAIL_EXISTS');
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email: email.toLowerCase(), passwordHash });
  res.cookie('imovies_token', signToken(user), cookieOptions()).status(201).json({ success: true, data: { user } });
});
export const login = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email.toLowerCase() }).select('+passwordHash');
  if (!user || !(await user.comparePassword(req.body.password))) throw new AppError('Email or password is incorrect.', 401, 'INVALID_CREDENTIALS');
  res.cookie('imovies_token', signToken(user), cookieOptions()).json({ success: true, data: { user: { _id: user._id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt } } });
});
export const logout = (req, res) => res.clearCookie('imovies_token', { ...cookieOptions(), maxAge: undefined }).json({ success: true, data: { message: 'Logged out successfully.' } });
export const me = (req, res) => res.json({ success: true, data: { user: req.user } });
