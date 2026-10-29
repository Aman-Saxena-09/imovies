export function notFound(req, res) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `Route not found: ${req.method} ${req.originalUrl}` } }); }
export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  let status = err.statusCode || 500, code = err.code || 'INTERNAL_ERROR', message = err.message || 'Something went wrong.';
  if (err.name === 'ValidationError') { status = 400; code = 'VALIDATION_ERROR'; message = Object.values(err.errors).map(e => e.message).join(' '); }
  if (err.code === 11000) { status = 409; code = 'DUPLICATE_VALUE'; message = 'That value already exists.'; }
  if (err.name === 'CastError') { status = 400; code = 'INVALID_ID'; message = 'The supplied ID is invalid.'; }
  if (status >= 500) console.error(err);
  res.status(status).json({ success: false, error: { code, message, ...(process.env.NODE_ENV === 'development' && status >= 500 ? { detail: err.message } : {}) } });
}
