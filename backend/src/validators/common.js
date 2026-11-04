const { z } = require('zod');

exports.objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
exports.idParam = z.object({ id: exports.objectId });
exports.isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD');

exports.pagination = {
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
};
