import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Avatar, Card, Stack, TextField, Typography } from '@mui/material';
import DataTable from '../shared/DataTable';
import StatusChip from '../../components/StatusChip';
import { fmtDateTime } from '../../utils/format';
import { selectCurrentUser } from '../../features/auth/authSlice';
import { useGetAllAttendanceQuery, useGetTeamAttendanceQuery } from '../../services/apiSlice';

const columns = [
  { key: 'employeeId', label: 'Employee', render: (r) => r.employeeId?.name || '—' },
  { key: 'date', label: 'Date' },
  { key: 'punchIn', label: 'Punch In', render: (r) => fmtDateTime(r.punchIn) },
  { key: 'punchOut', label: 'Punch Out', render: (r) => fmtDateTime(r.punchOut) },
  { key: 'totalWorkingHours', label: 'Hours', render: (r) => `${r.totalWorkingHours ?? 0} h` },
  { key: 'workingHoursStatus', label: 'Status', render: (r) => <StatusChip status={r.workingHoursStatus} /> },
  { key: 'validationStatus', label: 'Validation', render: (r) => <StatusChip status={r.validationStatus} /> },
  { key: 'selfies', label: 'Selfies', render: (r) => (
    <Stack direction="row" spacing={1}>
      <Avatar src={r.punchInSelfie} variant="rounded" sx={{ width: 32, height: 32 }} />
      {r.punchOutSelfie && <Avatar src={r.punchOutSelfie} variant="rounded" sx={{ width: 32, height: 32 }} />}
    </Stack>
  ) },
];

export default function TeamAttendancePage() {
  const user = useSelector(selectCurrentUser);
  const isAdmin = user?.role === 'admin';
  const [page, setPage] = useState(1);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const params = { page, limit: 10, ...(from && { from }), ...(to && { to }) };
  const teamQuery = useGetTeamAttendanceQuery(params, { skip: isAdmin });
  const allQuery = useGetAllAttendanceQuery(params, { skip: !isAdmin });
  const { data, isFetching } = isAdmin ? allQuery : teamQuery;

  return (
    <Stack spacing={2}>
      <Typography variant="h5" fontWeight={700}>{isAdmin ? 'All Attendance' : 'Team Attendance'}</Typography>
      <Stack direction="row" spacing={2}>
        <TextField label="From" type="date" size="small" InputLabelProps={{ shrink: true }} value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} />
        <TextField label="To" type="date" size="small" InputLabelProps={{ shrink: true }} value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} />
      </Stack>
      <Card variant="outlined" sx={{ p: 2 }}>
        <DataTable columns={columns} rows={data?.data} loading={isFetching} meta={data?.meta} onPageChange={setPage} emptyMessage="No attendance records found" />
      </Card>
    </Stack>
  );
}
