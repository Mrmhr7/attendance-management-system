const { z } = require('zod');
const { objectId, isoDate, pagination } = require('./common');

const location = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().min(0).optional(),
});

exports.punch = z.object({
  selfie: z.string().min(100, 'A live selfie is required').max(7_000_000, 'Selfie is too large'),
  location,
});

exports.validate = z
  .object({
    validationStatus: z.enum(['Valid', 'Invalid']),
    remarks: z.string().trim().max(500).optional().default(''),
  })
  .superRefine((v, ctx) => {
    if (v.validationStatus === 'Invalid' && !v.remarks) {
      ctx.addIssue({ code: 'custom', path: ['remarks'], message: 'Remarks are required when marking attendance invalid' });
    }
  });

exports.list = z.object({
  ...pagination,
  from: isoDate.optional(),
  to: isoDate.optional(),
  employeeId: objectId.optional(),
  validationStatus: z.enum(['Pending', 'Valid', 'Invalid']).optional(),
  workingHoursStatus: z.enum(['In Progress', 'Completed', 'Incomplete']).optional(),
  punchedOut: z.enum(['true', 'false']).optional(),
});

exports.report = z.object({ ...pagination, date: isoDate.optional() });
