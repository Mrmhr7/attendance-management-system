import { useState } from 'react';
import {
  Alert, Button, Card, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField, Typography,
} from '@mui/material';
import DataTable from '../shared/DataTable';
import StatusChip from '../../components/StatusChip';
import { fmtDateTime } from '../../utils/format';
import { useCreateOvertimeMutation, useGetMyAttendanceQuery, useGetMyOvertimeQuery } from '../../services/apiSlice';

const columns = [
  { key: 'attendanceId', label: 'Attendance Date', render: (r) => r.attendanceId?.date || '—' },
  { key: 'requestedHours', label: 'Requested Hours', render: (r) => `${r.requestedHours} h` },
  { key: 'reason', label: 'Reason' },
  { key: 'status', label: 'Status', render: (r) => <StatusChip status={r.status} /> },
  { key: 'remarks', label: 'Remarks', render: (r) => r.remarks || '—' },
  { key: 'reviewedAt', label: 'Reviewed', render: (r) => fmtDateTime(r.reviewedAt) },
];

export default function OvertimePage() {
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ attendanceId: '', requestedHours: '', reason: '' });
  const [error, setError] = useState('');

  const { data, isFetching } = useGetMyOvertimeQuery({ page, limit: 10 });
  const { data: eligible } = useGetMyAttendanceQuery({ page: 1, limit: 50, punchedOut: 'true' });
  const [createOvertime, { isLoading }] = useCreateOvertimeMutation();

  const submit = async () => {
    setError('');
    try {
      await createOvertime({ ...form, requestedHours: Number(form.requestedHours) }).unwrap();
      setOpen(false);
      setForm({ attendanceId: '', requestedHours: '', reason: '' });
    } catch (err) {
      setError(err?.data?.errors?.[0]?.message || err?.data?.message || 'Could not submit request');
    }
  };

  return (
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h5" fontWeight={700}>Overtime Requests</Typography>
        <Button variant="contained" onClick={() => setOpen(true)}>New Request</Button>
      </Stack>

      <Card variant="outlined" sx={{ p: 2 }}>
        <DataTable columns={columns} rows={data?.data} loading={isFetching} meta={data?.meta} onPageChange={setPage} emptyMessage="No overtime requests yet" />
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>New Overtime Request</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              select label="Attendance record" required value={form.attendanceId}
              onChange={(e) => setForm({ ...form, attendanceId: e.target.value })}
            >
              {(eligible?.data || []).map((a) => (
                <MenuItem key={a._id} value={a._id}>{a.date} ({a.totalWorkingHours}h worked)</MenuItem>
              ))}
            </TextField>
            <TextField
              label="Requested hours" type="number" required inputProps={{ step: 0.25, min: 0.25, max: 12 }}
              value={form.requestedHours} onChange={(e) => setForm({ ...form, requestedHours: e.target.value })}
            />
            <TextField
              label="Reason" required multiline minRows={2} value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={isLoading || !form.attendanceId || !form.requestedHours || !form.reason} onClick={submit}>
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
