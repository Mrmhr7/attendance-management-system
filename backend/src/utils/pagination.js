exports.getPagination = (q) => {
  const page = Math.max(1, Number(q.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(q.limit) || 10));
  return { page, limit, skip: (page - 1) * limit };
};
exports.buildMeta = (page, limit, total) => ({ page, limit, total, totalPages: Math.ceil(total / limit) || 1 });
exports.escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
