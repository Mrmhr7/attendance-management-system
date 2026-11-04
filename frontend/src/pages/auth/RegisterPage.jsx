import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Alert, Box, Button, Card, Link, Stack, TextField, Typography } from '@mui/material';
import { useRegisterMutation } from '../../services/apiSlice';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [register, { isLoading, error }] = useRegisterMutation();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    try {
      await register(form).unwrap();
      navigate('/', { replace: true });
    } catch {
      /* error state rendered below */
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
      <Card component="form" onSubmit={submit} sx={{ p: 4, width: 380 }} elevation={0} variant="outlined">
        <Typography variant="h5" fontWeight={700} mb={0.5}>Create your account</Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>Public sign-up creates an Employee account</Typography>
        <Stack spacing={2}>
          {error && (
            <Alert severity="error">
              {error.data?.errors?.[0]?.message || error.data?.message || 'Registration failed'}
            </Alert>
          )}
          <TextField label="Full name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <TextField label="Email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <TextField
            label="Password"
            type="password"
            required
            helperText="At least 8 characters, with a letter and a number"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <Button type="submit" variant="contained" size="large" disabled={isLoading}>
            {isLoading ? 'Creating account…' : 'Create Account'}
          </Button>
          <Typography variant="body2" textAlign="center">
            Already have an account? <Link component={RouterLink} to="/login">Sign in</Link>
          </Typography>
        </Stack>
      </Card>
    </Box>
  );
}
