import { useSelector } from 'react-redux';
import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import MyAttendancePage from './pages/employee/MyAttendancePage';
import OvertimePage from './pages/employee/OvertimePage';
import ManagerAdminDashboard from './pages/manager/ManagerAdminDashboard';
import TeamAttendancePage from './pages/manager/TeamAttendancePage';
import ValidationQueuePage from './pages/manager/ValidationQueuePage';
import OvertimeReviewPage from './pages/manager/OvertimeReviewPage';
import DailyReportPage from './pages/manager/DailyReportPage';
import UserManagementPage from './pages/admin/UserManagementPage';
import { selectCurrentUser } from './features/auth/authSlice';

function RoleHome() {
  const user = useSelector(selectCurrentUser);
  if (user?.role === 'employee') return <EmployeeDashboard />;
  return <ManagerAdminDashboard />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<RoleHome />} />

          <Route element={<ProtectedRoute roles={['employee']} />}>
            <Route path="/attendance" element={<MyAttendancePage />} />
          </Route>

          <Route element={<ProtectedRoute roles={['employee', 'manager', 'admin']} />}>
            <Route path="/overtime" element={<OvertimeRouter />} />
          </Route>

          <Route element={<ProtectedRoute roles={['manager', 'admin']} />}>
            <Route path="/team" element={<TeamAttendancePage />} />
            <Route path="/validation" element={<ValidationQueuePage />} />
            <Route path="/reports" element={<DailyReportPage />} />
          </Route>

          <Route element={<ProtectedRoute roles={['admin']} />}>
            <Route path="/users" element={<UserManagementPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// /overtime shows the employee's own requests, or the review queue for managers/admins
function OvertimeRouter() {
  const user = useSelector(selectCurrentUser);
  return user?.role === 'employee' ? <OvertimePage /> : <OvertimeReviewPage />;
}
