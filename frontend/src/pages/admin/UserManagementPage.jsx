import { useState } from 'react';
import {
  Alert, Button, Card, Chip, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, Switch,
  TextField, Typography, FormControlLabel,
} from '@mui/material';
import DataTable from '../shared/DataTable';
import ConfirmDialog from '../../components/ConfirmDialog';
import {
  useAssignManagerMutation, useCreateUserMutation, useGetUsersQuery, useUpdateUserMutation, useUpdateUserStatusMutation,
} from '../../services/apiSlice';

const emptyForm = { name: '', email: '', password: '', role: 'employee', managerId: '', isActive: true };

export default function UserManagementPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null); // null = closed, {} = new, object = edit
  const [form, setForm] = useState(emptyForm);
  const [toDeactivate, setToDeactivate] = useState(null);
  const [error, setError] = useState('');

  const { data, isFetching } = useGetUsersQuery({ page, limit: 10, ...(search && { search }) });
  const { data: managersRes } = useGetUsersQuery({ page: 1, limit: 100, role: 'manager' });
  const [createUser, { isLoading: creating }] = useCreateUserMutation();
  const [updateUser, { isLoading: updating }] = useUpdateUserMutation();
  const [updateUserStatus] = useUpdateUserStatusMutation();
  const [assignManager] = useAssignManagerMutation();

  const openNew = () => { setForm(emptyForm); setEditing({}); setError(''); };
  const openEdit = (u) => {
    setForm({ name: u.name, email: u.email, password: '', role: u.role, managerId: u.managerId?._id || '', isActive: u.isActive });
    setEditing(u);
    setError('');
  };

  const submit = async () => {
    setError('');
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      if (payload.role !== 'employee') delete payload.managerId;
      if (editing?._id) await updateUser({ id: editing._id, ...payload }).unwrap();
      else await createUser(payload).unwrap();
      setEditing(null);
    } catch (err) {
      setError(err?.data?.errors?.[0]?.message || err?.data?.message || 'Could not save user');
    }
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role', render: (r) => <Chip size="small" label={r.role} /> },
    { key: 'managerId', label: 'Manager', render: (r) => (
      r.role === 'employee' ? (
        <TextField
          select size="small" variant="standard" value={r.managerId?._id || ''} sx={{ minWidth: 140 }}
          onChange={(e) => assignManager({ id: r._id, managerId: e.target.value || null })}
        >
          <MenuItem value="">Unassigned</MenuItem>
          {(managersRes?.data || []).map((m) => <MenuItem key={m._id} value={m._id}>{m.name}</MenuItem>)}
        </TextField>
      ) : '—'
    ) },
    { key: 'isActive', label: 'Active', render: (r) => <Chip size="small" color={r.isActive ? 'success' : 'default'} label={r.isActive ? 'Active' : 'Inactive'} /> },
    { key: 'actions', label: '', render: (r) => (
      <Stack direction="row" spacing={1}>
        <Button size="small" onClick={() => openEdit(r)}>Edit</Button>
        {r.isActive
          ? <Button size="small" color="error" onClick={() => setToDeactivate(r)}>Deactivate</Button>
          : <Button size="small" color="success" onClick={() => updateUserStatus({ id: r._id, isActive: true })}>Activate</Button>}
      </Stack>
    ) },
  ];

  return (
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
        <Typography variant="h5" fontWeight={700}>User Management</Typography>
        <Stack direction="row" spacing={2}>
          <TextField size="small" label="Search" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          <Button variant="contained" onClick={openNew}>New User</Button>
        </Stack>
      </Stack>

      <Card variant="outlined" sx={{ p: 2 }}>
        <DataTable columns={columns} rows={data?.data} loading={isFetching} meta={data?.meta} onPageChange={setPage} emptyMessage="No users found" />
      </Card>

      <Dialog open={Boolean(editing)} onClose={() => setEditing(null)} fullWidth maxWidth="xs">
        <DialogTitle>{editing?._id ? 'Edit User' : 'New User'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField label="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <TextField label="Email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <TextField
              label={editing?._id ? 'New password (optional)' : 'Password'} type="password" required={!editing?._id}
              value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <TextField select label="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <MenuItem value="employee">Employee</MenuItem>
              <MenuItem value="manager">Manager</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </TextField>
            {form.role === 'employee' && (
              <TextField select label="Manager" value={form.managerId} onChange={(e) => setForm({ ...form, managerId: e.target.value })}>
                <MenuItem value="">None</MenuItem>
                {(managersRes?.data || []).map((m) => <MenuItem key={m._id} value={m._id}>{m.name}</MenuItem>)}
              </TextField>
            )}
            <FormControlLabel
              control={<Switch checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />}
              label="Active"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditing(null)}>Cancel</Button>
          <Button variant="contained" disabled={creating || updating} onClick={submit}>Save</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={Boolean(toDeactivate)}
        title="Deactivate user?"
        description={`${toDeactivate?.name} will no longer be able to log in. Their attendance history is kept.`}
        confirmColor="error"
        onCancel={() => setToDeactivate(null)}
        onConfirm={async () => { await updateUserStatus({ id: toDeactivate._id, isActive: false }); setToDeactivate(null); }}
      />
    </Stack>
  );
}