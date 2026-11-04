import { useState } from 'react';
import { Avatar, Card, Grid, Stack, TextField, Typography } from '@mui/material';
import DataTable from '../shared/DataTable';
import StatCard from '../../components/StatCard';
import StatusChip from '../../components/StatusChip';
import { fmtDateTime } from '../../utils/format';
import { useGetDailyReportQuery } from '../../services/apiSlice';

const columns = [
  { key: 'employeeId', label: 'Employee', render: (r) => r.employeeId?.name || '—' },
  { key: 'punchIn', label: 'Punch In', render: (r) => fmtDateTime(r.punchIn) },
  { key: 'punchOut', label: 'Punch Out', render: (r) => fmtDateTime(r.punchOut) },
  { key: 'totalWorkingHours', label: 'Hours', render: (r) => `${r.totalWorkingHours ?? 0} h` },
  { key: 'workingHoursStatus', label: 'Status', render: (r) => <StatusChip status={r.workingHoursStatus} /> },
  { key: 'validationStatus', label: 'Validation', render: (r) => <StatusChip status={r.validationStatus} /> },
  { key: 'overtimeStatus', label: 'Overtime', render: (r) => <StatusChip status={r.overtimeStatus} /> },
  { key: 'selfies', label: 'Selfies', render: (r) => (
    <Stack direction="row" spacing={1}>
      <Avatar src={r.punchInSelfie} variant="rounded" sx={{ width: 28, height: 28 }} />
      {r.punchOutSelfie && <Avatar src={r.punchOutSelfie} variant="rounded" sx={{ width: 28, height: 28 }} />}
    </Stack>
  ) },
];

export default function DailyReportPage() {
  const [page, setPage] = useState(1);
  const [date, setDate] = useState('');
  const { data, isFetching } = useGetDailyReportQuery({ page, limit: 10, ...(date && { date }) });
  const summary = data?.meta?.summary;

  return (
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
        <Typography variant="h5" fontWeight={700}>Daily Report {data?.meta?.date ? `— ${data.meta.date}` : ''}</Typography>
        <TextField label="Date" type="date" size="small" InputLabelProps={{ shrink: true }} value={date} onChange={(e) => { setDate(e.target.value); setPage(1); }} />
      </Stack>

      {summary && (
        <Grid container spacing={2}>
          <Grid item xs={6} sm={3}><StatCard label="Total" value={summary.total} /></Grid>
          <Grid item xs={6} sm={3}><StatCard label="Completed" value={summary.completed} color="success.main" /></Grid>
          <Grid item xs={6} sm={3}><StatCard label="Incomplete" value={summary.incomplete} color="error.main" /></Grid>
          <Grid item xs={6} sm={3}><StatCard label="In Progress" value={summary.inProgress} color="warning.main" /></Grid>
        </Grid>
      )}

      <Card variant="outlined" sx={{ p: 2 }}>
        <DataTable columns={columns} rows={data?.data} loading={isFetching} meta={data?.meta} onPageChange={setPage} emptyMessage="No records for this date" />
      </Card>
    </Stack>
  );
}
