const { z } = require('zod');
const { objectId, pagination } = require('./common');

exports.create = z.object({
  attendanceId: objectId,
  requestedHours: z.number().min(0.25, 'Minimum is 0.25 hours').max(12, 'Maximum is 12 hours'),
  reason: z.string().trim().min(5, 'Please give a reason (min 5 characters)').max(500),
});

exports.review = z
  .object({
    status: z.enum(['Approved', 'Rejected']),
    remarks: z.string().trim().max(500).optional().default(''),
  })
  .superRefine((v, ctx) => {
    if (v.status === 'Rejected' && !v.remarks) {
      ctx.addIssue({ code: 'custom', path: ['remarks'], message: 'Remarks are required when rejecting a request' });
    }
  });

exports.list = z.object({
  ...pagination,
  status: z.enum(['Pending', 'Approved', 'Rejected', 'All']).optional(),
});
