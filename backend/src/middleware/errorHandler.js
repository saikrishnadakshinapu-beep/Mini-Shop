const HttpError = require('../errors/HttpError');

function notFound(req, res, next) {
  const error = new HttpError(404, 'ROUTE_NOT_FOUND', 'The requested API route does not exist.');
  next(error);
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  if (error instanceof HttpError) {
    return res.status(error.status).json({ error: { code: error.code, message: error.message } });
  }
  if (error?.type === 'entity.too.large') {
    return res.status(413).json({ error: { code: 'REQUEST_TOO_LARGE', message: 'The request body is too large.' } });
  }
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({ error: { code: 'INVALID_JSON', message: 'The request body must contain valid JSON.' } });
  }
  if (error?.code === 11000) {
    return res.status(409).json({ error: { code: 'DUPLICATE_RECORD', message: 'A record with that value already exists.' } });
  }

  console.error('Unhandled API error:', error);
  return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong. Please try again.' } });
}

module.exports = { notFound, errorHandler };
