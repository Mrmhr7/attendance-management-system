const ApiError = require('../utils/ApiError');

// Parses with zod. Unknown keys are stripped, which protects against mass assignment.
module.exports = (schema, source = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    const errors = result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
    return next(new ApiError(400, 'Validation failed', errors));
  }
  req[source] = result.data;
  next();
};
