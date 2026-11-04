import { useState } from 'react';
import { Alert, Box, Button, Card, Grid, Stack, Typography } from '@mui/material';
import CameraCapture from '../../components/CameraCapture';
import StatCard from '../../components/StatCard';
import StatusChip from '../../components/StatusChip';
import useGeolocation from '../../hooks/useGeolocation';
import { fmtTime } from '../../utils/format';
import {
  useGetTodayAttendanceQuery, usePunchInMutation, usePunchOutMutation, useGetDashboardStatsQuery,
} from '../../services/apiSlice';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import TimerIcon from '@mui/icons-material/Timer';

export default function EmployeeDashboard() {
  const { data: todayRes, isLoading } = useGetTodayAttendanceQuery();
  const { data: statsRes } = useGetDashboardStatsQuery();
  const [punchIn, { isLoading: punchingIn }] = usePunchInMutation();
  const [punchOut, { isLoading: punchingOut }] = usePunchOutMutation();
  const getLocation = useGeolocation();

  const [selfie, setSelfie] = useState(null);
  const [error, setError] = useState('');

  const today = todayRes?.data;
  const stats = statsRes?.data;
  const isPunchedIn = today && !today.punchOut;

  const submit = async (action) => {
    setError('');
    if (!selfie) return setError('Please capture a selfie first');
    try {
      const location = await getLocation();
      await action({ selfie, location }).unwrap();
      setSelfie(null);
    } catch (err) {
      setError(err?.data?.message || err.message || 'Something went wrong');
    }
  };

  return (
    <Stack spacing={3}>
      <Typography variant="h5" fontWeight={700}>My Dashboard</Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          <StatCard label="This month: Completed" value={stats?.month?.completed ?? '—'} icon={<EventAvailableIcon />} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard label="This month: Incomplete" value={stats?.month?.incomplete ?? '—'} icon={<AccessTimeIcon />} color="error.main" />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard label="Pending overtime requests" value={stats?.pendingOvertime ?? '—'} icon={<TimerIcon />} color="warning.main" />
        </Grid>
      </Grid>

      <Card variant="outlined" sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
            <Typography variant="h6">Today's Attendance</Typography>
            {today && <StatusChip status={today.punchOut ? today.workingHoursStatus : 'In Progress'} />}
          </Stack>

          {!isLoading && today && (
            <Stack direction="row" spacing={4} flexWrap="wrap">
              <Box><Typography variant="caption" color="text.secondary">Punch In</Typography><Typography>{fmtTime(today.punchIn)}</Typography></Box>
              <Box><Typography variant="caption" color="text.secondary">Punch Out</Typography><Typography>{fmtTime(today.punchOut)}</Typography></Box>
              <Box><Typography variant="caption" color="text.secondary">Working Hours</Typography><Typography>{today.liveWorkingHours ?? today.totalWorkingHours ?? 0} h</Typography></Box>
              <Box><Typography variant="caption" color="text.secondary">Remaining</Typography><Typography>{today.remainingHours ?? 0} h</Typography></Box>
            </Stack>
          )}

          {error && <Alert severity="error">{error}</Alert>}

          <Box>
            <Typography variant="subtitle2" mb={1}>
              {isPunchedIn ? 'Capture selfie to Punch Out' : 'Capture selfie to Punch In'}
            </Typography>
            <CameraCapture captured={selfie} onCapture={setSelfie} />
          </Box>

          <Stack direction="row" spacing={2}>
            {!isPunchedIn && (
              <Button
                variant="contained"
                size="large"
                disabled={!selfie || punchingIn || (today && today.punchOut)}
                onClick={() => submit(punchIn)}
              >
                {punchingIn ? 'Punching in…' : 'Punch In'}
              </Button>
            )}
            {isPunchedIn && (
              <Button variant="contained" color="secondary" size="large" disabled={!selfie || punchingOut} onClick={() => submit(punchOut)}>
                {punchingOut ? 'Punching out…' : 'Punch Out'}
              </Button>
            )}
            {today?.punchOut && (
              <Alert severity="success" sx={{ flex: 1 }}>You've completed today's attendance. See you tomorrow!</Alert>
            )}
          </Stack>
        </Stack>
      </Card>
    </Stack>
  );
}
