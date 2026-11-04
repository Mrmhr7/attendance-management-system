import { useSelector } from 'react-redux';
import { Grid, Stack, Typography } from '@mui/material';
import StatCard from '../../components/StatCard';
import { selectCurrentUser } from '../../features/auth/authSlice';
import { useGetDashboardStatsQuery } from '../../services/apiSlice';
import GroupIcon from '@mui/icons-material/Group';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TimerIcon from '@mui/icons-material/Timer';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import BadgeIcon from '@mui/icons-material/Badge';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';

export default function ManagerAdminDashboard() {
  const user = useSelector(selectCurrentUser);
  const { data } = useGetDashboardStatsQuery();
  const s = data?.data || {};
  const isAdmin = user?.role === 'admin';

  return (
    <Stack spacing={3}>
      <Typography variant="h5" fontWeight={700}>{isAdmin ? 'Admin' : 'Manager'} Dashboard</Typography>
      <Grid container spacing={2}>
        {isAdmin ? (
          <>
            <Grid item xs={12} sm={6} md={3}><StatCard label="Total Employees" value={s.totalEmployees ?? '—'} icon={<BadgeIcon />} /></Grid>
            <Grid item xs={12} sm={6} md={3}><StatCard label="Total Managers" value={s.totalManagers ?? '—'} icon={<AssignmentIndIcon />} /></Grid>
            <Grid item xs={12} sm={6} md={3}><StatCard label="Total Attendance Records" value={s.totalAttendance ?? '—'} icon={<EventAvailableIcon />} /></Grid>
            <Grid item xs={12} sm={6} md={3}><StatCard label="Present Today" value={s.presentToday ?? '—'} icon={<GroupIcon />} color="secondary.main" /></Grid>
            <Grid item xs={12} sm={6} md={3}><StatCard label="Incomplete Attendance" value={s.incompleteAttendance ?? '—'} icon={<AccessTimeIcon />} color="error.main" /></Grid>
            <Grid item xs={12} sm={6} md={3}><StatCard label="Pending Overtime" value={s.pendingOvertime ?? '—'} icon={<TimerIcon />} color="warning.main" /></Grid>
            <Grid item xs={12} sm={6} md={3}><StatCard label="Invalid Attendance" value={s.invalidRecords ?? '—'} icon={<ErrorOutlineIcon />} color="error.main" /></Grid>
          </>
        ) : (
          <>
            <Grid item xs={12} sm={6} md={4}><StatCard label="Total Team Members" value={s.teamMembers ?? '—'} icon={<GroupIcon />} /></Grid>
            <Grid item xs={12} sm={6} md={4}><StatCard label="Present Today" value={s.presentToday ?? '—'} icon={<EventAvailableIcon />} color="secondary.main" /></Grid>
            <Grid item xs={12} sm={6} md={4}><StatCard label="Incomplete Attendance" value={s.incompleteAttendance ?? '—'} icon={<AccessTimeIcon />} color="error.main" /></Grid>
            <Grid item xs={12} sm={6} md={4}><StatCard label="Pending Overtime Requests" value={s.pendingOvertime ?? '—'} icon={<TimerIcon />} color="warning.main" /></Grid>
            <Grid item xs={12} sm={6} md={4}><StatCard label="Attendance Verification Queue" value={s.verificationQueue ?? '—'} icon={<FactCheckIcon />} color="warning.main" /></Grid>
          </>
        )}
      </Grid>
    </Stack>
  );
}
