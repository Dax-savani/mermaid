
const notFound = (req, res, next) => {
  const error = new Error(`Not Found : ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);

  console.error(err.message, { stack: err.stack });

  res.json({
      status: 'error',
      statusCode,
      message: err?.message,
      stack: err?.stack
  });
};

module.exports = { notFound, errorHandler };
