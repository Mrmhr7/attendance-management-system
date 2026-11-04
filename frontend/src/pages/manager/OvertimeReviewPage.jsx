import { useState } from 'react';
import {
  Alert, Button, Card, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField, Typography,
} from '@mui/material';
import DataTable from '../shared/DataTable';
import StatusChip from '../../components/StatusChip';
import { fmtDateTime } from '../../utils/format';
import { useGetPendingOvertimeQuery, useReviewOvertimeMutation } from '../../services/apiSlice';

export default function OvertimeReviewPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('Pending');
  const [selected, setSelected] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState('');

  const { data, isFetching } = useGetPendingOvertimeQuery({ page, limit: 10, status });
  const [reviewOvertime, { isLoading }] = useReviewOvertimeMutation();

  const columns = [
    { key: 'employeeId', label: 'Employee', render: (r) => r.employeeId?.name || '—' },
    { key: 'attendanceId', label: 'Attendance Date', render: (r) => r.attendanceId?.date || '—' },
    { key: 'requestedHours', label: 'Hours', render: (r) => `${r.requestedHours} h` },
    { key: 'reason', label: 'Reason' },
    { key: 'status', label: 'Status', render: (r) => <StatusChip status={r.status} /> },
    { key: 'action', label: '', render: (r) => r.status === 'Pending' && (
      <Button size="small" onClick={() => { setSelected(r); setRemarks(''); setError(''); }}>Review</Button>
    ) },
  ];

  const decide = async (reviewStatus) => {
    setError('');
    if (reviewStatus === 'Rejected' && !remarks.trim()) return setError('Remarks are required when rejecting');
    try {
      await reviewOvertime({ id: selected._id, status: reviewStatus, remarks }).unwrap();
      setSelected(null);
    } catch (err) {
      setError(err?.data?.message || 'Could not submit review');
    }
  };

  return (
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h5" fontWeight={700}>Overtime Requests</Typography>
        <TextField select size="small" label="Status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} sx={{ width: 160 }}>
          {['Pending', 'Approved', 'Rejected', 'All'].map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
        </TextField>
      </Stack>
      <Card variant="outlined" sx={{ p: 2 }}>
        <DataTable columns={columns} rows={data?.data} loading={isFetching} meta={data?.meta} onPageChange={setPage} emptyMessage="No requests found" />
      </Card>

      <Dialog open={Boolean(selected)} onClose={() => setSelected(null)} fullWidth maxWidth="xs">
        <DialogTitle>Review Overtime Request</DialogTitle>
        <DialogContent>
          {selected && (
            <Stack spacing={2} mt={1}>
              {error && <Alert severity="error">{error}</Alert>}
              <Typography variant="body2"><b>Employee:</b> {selected.employeeId?.name}</Typography>
              <Typography variant="body2"><b>Attendance date:</b> {selected.attendanceId?.date}</Typography>
              <Typography variant="body2"><b>Requested hours:</b> {selected.requestedHours} h</Typography>
              <Typography variant="body2"><b>Reason:</b> {selected.reason}</Typography>
              <Typography variant="body2"><b>Submitted:</b> {fmtDateTime(selected.createdAt)}</Typography>
              <TextField label="Remarks" multiline minRows={2} value={remarks} onChange={(e) => setRemarks(e.target.value)} />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelected(null)}>Cancel</Button>
          <Button color="error" variant="outlined" disabled={isLoading} onClick={() => decide('Rejected')}>Reject</Button>
          <Button color="success" variant="contained" disabled={isLoading} onClick={() => decide('Approved')}>Approve</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
