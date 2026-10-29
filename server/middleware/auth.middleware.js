import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/errors.js';

export const signToken = (user) => jwt.sign({ sub: user._id.toString(), role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1d' });
export const cookieOptions = () => ({ httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: process.env.COOKIE_SAME_SITE || 'lax', maxAge: 24 * 60 * 60 * 1000, path: '/' });

export const requireAuth = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.imovies_token || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null);
  if (!token) throw new AppError('Please log in to continue.', 401, 'AUTH_REQUIRED');
  let payload;
  try { payload = jwt.verify(token, process.env.JWT_SECRET); } catch { throw new AppError('Your session is invalid or expired. Please log in again.', 401, 'INVALID_TOKEN'); }
  const user = await User.findById(payload.sub);
  if (!user) throw new AppError('Account not found. Please log in again.', 401, 'USER_NOT_FOUND');
  req.user = user; next();
});
export const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'ADMIN') return next(new AppError('Administrator access is required.', 403, 'FORBIDDEN'));
  next();
};
