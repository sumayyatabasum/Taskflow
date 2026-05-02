const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);

  // PostgreSQL unique violation
  if (err.code === '23505') {
    return res.status(409).json({ error: 'A record with this information already exists.' });
  }

  // PostgreSQL foreign key violation
  if (err.code === '23503') {
    return res.status(400).json({ error: 'Referenced record does not exist.' });
  }

  // PostgreSQL check constraint violation
  if (err.code === '23514') {
    return res.status(400).json({ error: 'Invalid value for this field.' });
  }

  // Default server error
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error.',
  });
};

module.exports = errorHandler;
