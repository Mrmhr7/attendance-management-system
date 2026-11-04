export const fmtDateTime = (d) => (d ? new Date(d).toLocaleString() : '—');
export const fmtTime = (d) => (d ? new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—');
export const statusColor = (status) => {
  const map = {
    Completed: 'success', Valid: 'success', Approved: 'success',
    Incomplete: 'error', Invalid: 'error', Rejected: 'error',
    'In Progress': 'warning', Pending: 'warning', None: 'default',
  };
  return map[status] || 'default';
};
