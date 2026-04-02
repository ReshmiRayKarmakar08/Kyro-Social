const notFound = (req, res) => {
  res.status(404).json({
    message: 'Route not found',
  });
};

const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File size cannot exceed 5MB' });
    }
    return res.status(400).json({ message: err.message });
  }

  if (err.isJoi && err.details) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: err.details.map((detail) => detail.message),
    });
  }

  const statusCode = err.statusCode || err.status || 500;
  return res.status(statusCode).json({
    message: err.message || 'Internal server error',
  });
};

module.exports = { notFound, errorHandler };
