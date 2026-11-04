import { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Alert, Avatar, Button, Card, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography, Box, Grid,
} from '@mui/material';
import DataTable from '../shared/DataTable';
import StatusChip from '../../components/StatusChip';
import { fmtDateTime } from '../../utils/format';
import { selectCurrentUser } from '../../features/auth/authSlice';
import { useGetAllAttendanceQuery, useGetTeamAttendanceQuery, useValidateAttendanceMutation } from '../../services/apiSlice';

export default function ValidationQueuePage() {
  const user = useSelector(selectCurrentUser);
  const isAdmin = user?.role === 'admin';
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState('');

  const params = { page, limit: 10, validationStatus: 'Pending', punchedOut: 'true' };
  const teamQuery = useGetTeamAttendanceQuery(params, { skip: isAdmin });
  const allQuery = useGetAllAttendanceQuery(params, { skip: !isAdmin });
  const { data, isFetching } = isAdmin ? allQuery : teamQuery;
  const [validateAttendance, { isLoading }] = useValidateAttendanceMutation();

  const columns = [
    { key: 'employeeId', label: 'Employee', render: (r) => r.employeeId?.name || '—' },
    { key: 'date', label: 'Date' },
    { key: 'totalWorkingHours', label: 'Hours', render: (r) => `${r.totalWorkingHours ?? 0} h` },
    { key: 'action', label: '', render: (r) => <Button size="small" onClick={() => { setSelected(r); setRemarks(''); setError(''); }}>Review</Button> },
  ];

  const decide = async (validationStatus) => {
    setError('');
    if (validationStatus === 'Invalid' && !remarks.trim()) return setError('Remarks are required when marking invalid');
    try {
      await validateAttendance({ id: selected._id, validationStatus, remarks }).unwrap();
      setSelected(null);
    } catch (err) {
      setError(err?.data?.message || 'Could not submit review');
    }
  };

  return (
    <Stack spacing={2}>
      <Typography variant="h5" fontWeight={700}>Attendance Validation Queue</Typography>
      <Card variant="outlined" sx={{ p: 2 }}>
        <DataTable columns={columns} rows={data?.data} loading={isFetching} meta={data?.meta} onPageChange={setPage} emptyMessage="Nothing pending review" />
      </Card>

      <Dialog open={Boolean(selected)} onClose={() => setSelected(null)} fullWidth maxWidth="sm">
        <DialogTitle>Review Attendance — {selected?.employeeId?.name}</DialogTitle>
        <DialogContent>
          {selected && (
            <Stack spacing={2} mt={1}>
              <Alert severity="info">
                Review the selfies and locations manually. A photo being displayed does not by itself confirm it is genuine.
              </Alert>
              {error && <Alert severity="error">{error}</Alert>}
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Punch In — {fmtDateTime(selected.punchIn)}</Typography>
                  <Box component="img" src={selected.punchInSelfie} sx={{ width: '100%', borderRadius: 1, border: '1px solid #ddd' }} />
                  <Typography variant="caption">{selected.punchInLocation?.latitude?.toFixed(5)}, {selected.punchInLocation?.longitude?.toFixed(5)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Punch Out — {fmtDateTime(selected.punchOut)}</Typography>
                  <Box component="img" src={selected.punchOutSelfie} sx={{ width: '100%', borderRadius: 1, border: '1px solid #ddd' }} />
                  <Typography variant="caption">{selected.punchOutLocation?.latitude?.toFixed(5)}, {selected.punchOutLocation?.longitude?.toFixed(5)}</Typography>
                </Grid>
              </Grid>
              <Typography variant="body2">Working hours: <StatusChip status={selected.workingHoursStatus} /></Typography>
              <TextField label="Remarks" multiline minRows={2} value={remarks} onChange={(e) => setRemarks(e.target.value)} />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelected(null)}>Cancel</Button>
          <Button color="error" variant="outlined" disabled={isLoading} onClick={() => decide('Invalid')}>Mark Invalid</Button>
          <Button color="success" variant="contained" disabled={isLoading} onClick={() => decide('Valid')}>Mark Valid</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
