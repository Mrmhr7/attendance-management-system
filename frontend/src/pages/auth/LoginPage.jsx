import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { Alert, Box, Button, Card, Link, Stack, TextField, Typography } from '@mui/material';
import { useLoginMutation } from '../../services/apiSlice';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [login, { isLoading, error }] = useLoginMutation();
  const navigate = useNavigate();
  const location = useLocation();

  const submit = async (e) => {
    e.preventDefault();
    try {
      await login(form).unwrap();
      navigate(location.state?.from?.pathname || '/', { replace: true });
    } catch {
      /* error state rendered below */
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
      <Card component="form" onSubmit={submit} sx={{ p: 4, width: 380 }} elevation={0} variant="outlined">
        <Typography variant="h5" fontWeight={700} mb={0.5}>Welcome back</Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>Sign in to Attendance Management System</Typography>
        <Stack spacing={2}>
          {error && <Alert severity="error">{error.data?.message || 'Login failed'}</Alert>}
          <TextField label="Email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <TextField label="Password" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <Button type="submit" variant="contained" size="large" disabled={isLoading}>
            {isLoading ? 'Signing in…' : 'Sign In'}
          </Button>
          <Typography variant="body2" textAlign="center">
            New employee? <Link component={RouterLink} to="/register">Create an account</Link>
          </Typography>
        </Stack>
      </Card>
    </Box>
  );
}
