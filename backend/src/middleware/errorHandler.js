/**
 * Global error handler middleware
 * Sanitizes errors and prevents sensitive credential / stack trace leakage
 */
export function errorHandler(err, req, res, _next) {
  // Log sanitized error without request credentials
  const sanitizedPath = req.baseUrl + (req.path || '');
  console.error(`[GhostVault Error] [${req.method} ${sanitizedPath}]:`, {
    name: err.name,
    message: err.message,
    code: err.code,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });

  // Prisma unique constraint error
  if (err.code === 'P2002') {
    return res.status(400).json({
      error: 'Duplicate entry',
      details: 'A record with this identifier already exists'
    });
  }

  // Prisma record not found
  if (err.code === 'P2025') {
    return res.status(404).json({
      error: 'Not found',
      details: 'The requested resource does not exist'
    });
  }

  // Validation errors
  if (err.name === 'ZodError') {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.issues ? err.issues.map(e => ({ field: e.path.join('.'), message: e.message })) : err.message
    });
  }

  // Known 401 / 403 errors
  if (err.name === 'UnauthorizedError' || err.message?.includes('Unauthorized')) {
    return res.status(401).json({ error: 'Unauthorized access' });
  }

  // Default error response
  const statusCode = err.statusCode && Number.isInteger(err.statusCode) ? err.statusCode : 500;
  res.status(statusCode).json({
    error: statusCode === 500 && process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred. Please try again later.'
      : (err.message || 'Internal server error'),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

/**
 * 404 Route Not Found handler
 */
export function notFoundHandler(req, res) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}
