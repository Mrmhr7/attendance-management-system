import { useState } from 'react';
import { Avatar, Card, Stack, Typography } from '@mui/material';
import DataTable from '../shared/DataTable';
import StatusChip from '../../components/StatusChip';
import { fmtDateTime } from '../../utils/format';
import { useGetMyAttendanceQuery } from '../../services/apiSlice';

const columns = [
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

export default function MyAttendancePage() {
  const [page, setPage] = useState(1);
  const { data, isFetching } = useGetMyAttendanceQuery({ page, limit: 10 });

  return (
    <Stack spacing={2}>
      <Typography variant="h5" fontWeight={700}>My Attendance History</Typography>
      <Card variant="outlined" sx={{ p: 2 }}>
        <DataTable
          columns={columns}
          rows={data?.data}
          loading={isFetching}
          meta={data?.meta}
          onPageChange={setPage}
          emptyMessage="No attendance records yet"
        />
      </Card>
    </Stack>
  );
}
