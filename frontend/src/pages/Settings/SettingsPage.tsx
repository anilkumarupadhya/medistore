import React, { useState } from 'react';
import {
  Box, Typography, Tabs, Tab, Stack, TextField, Button,
  Card, CardContent, Avatar, Chip, Divider, CircularProgress,
  Alert,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../../api/auth';
import { useAuthStore } from '../../store/authStore';

const ROLE_COLORS: Record<string, string> = {
  ADMIN:             '#ef5350',
  PHARMACIST:        '#42a5f5',
  CASHIER:           '#66bb6a',
  INVENTORY_MANAGER: '#ffa726',
};

// ─── Profile Tab ─────────────────────────────────────────────────────────────
function ProfileTab() {
  const { user, setUser } = useAuthStore();
  const { enqueueSnackbar } = useSnackbar();

  const [form, setForm] = useState({
    first_name: user?.first_name ?? '',
    last_name:  user?.last_name  ?? '',
    phone:      user?.phone      ?? '',
  });

  const mutation = useMutation({
    mutationFn: () => authApi.updateMe(form),
    onSuccess: (res) => {
      setUser(res.data.data);
      enqueueSnackbar('Profile updated successfully', { variant: 'success' });
    },
    onError: () => enqueueSnackbar('Failed to update profile', { variant: 'error' }),
  });

  return (
    <Stack spacing={3} maxWidth={520}>
      {/* Avatar + role card */}
      <Card variant="outlined" sx={{ borderRadius: 2 }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar
              sx={{
                width: 64, height: 64,
                background: ROLE_COLORS[user?.role ?? 'PHARMACIST'],
                fontSize: 22, fontWeight: 800,
              }}
            >
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={700}>{user?.full_name}</Typography>
              <Typography variant="body2" color="text.secondary">{user?.email}</Typography>
              <Chip
                label={user?.role?.replace('_', ' ')}
                size="small"
                sx={{
                  mt: 0.5, height: 20, fontSize: '0.65rem', fontWeight: 700,
                  background: ROLE_COLORS[user?.role ?? 'PHARMACIST'],
                  color: '#fff',
                }}
              />
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <Divider />

      {/* Edit form */}
      <Typography variant="subtitle1" fontWeight={700}>Edit Profile</Typography>
      <Stack direction="row" spacing={2}>
        <TextField
          label="First Name"
          value={form.first_name}
          onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
          fullWidth
        />
        <TextField
          label="Last Name"
          value={form.last_name}
          onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))}
          fullWidth
        />
      </Stack>
      <TextField
        label="Phone"
        value={form.phone}
        onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
        fullWidth
      />
      <TextField
        label="Email"
        value={user?.email ?? ''}
        disabled
        fullWidth
        helperText="Email cannot be changed"
      />

      <Button
        variant="contained"
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
        sx={{ alignSelf: 'flex-start' }}
      >
        {mutation.isPending && <CircularProgress size={16} sx={{ mr: 1 }} />}
        Save Changes
      </Button>
    </Stack>
  );
}

// ─── Security Tab ─────────────────────────────────────────────────────────────
function SecurityTab() {
  const { enqueueSnackbar } = useSnackbar();
  const [form, setForm] = useState({
    old_password:         '',
    new_password:         '',
    confirm_new_password: '',
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const mutation = useMutation({
    mutationFn: () => authApi.changePassword(form),
    onSuccess: () => {
      setForm({ old_password: '', new_password: '', confirm_new_password: '' });
      setFieldErrors({});
      setSuccess(true);
      enqueueSnackbar('Password changed successfully', { variant: 'success' });
    },
    onError: (err: any) => {
      const details = err?.response?.data?.error?.details ?? {};
      const msg     = err?.response?.data?.error?.message ?? 'Failed to change password';
      setFieldErrors(details);
      enqueueSnackbar(msg, { variant: 'error' });
    },
  });

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.old_password) errs.old_password = 'Required';
    if (!form.new_password) errs.new_password = 'Required';
    if (form.new_password.length < 8) errs.new_password = 'Minimum 8 characters';
    if (form.new_password !== form.confirm_new_password)
      errs.confirm_new_password = 'Passwords do not match';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    setSuccess(false);
    mutation.mutate();
  };

  return (
    <Stack spacing={2.5} maxWidth={400}>
      <Typography variant="subtitle1" fontWeight={700}>Change Password</Typography>

      {success && (
        <Alert severity="success" onClose={() => setSuccess(false)}>
          Password changed successfully.
        </Alert>
      )}

      <TextField
        label="Current Password"
        type="password"
        value={form.old_password}
        onChange={e => setForm(f => ({ ...f, old_password: e.target.value }))}
        error={!!fieldErrors.old_password}
        helperText={fieldErrors.old_password}
        fullWidth
      />
      <TextField
        label="New Password"
        type="password"
        value={form.new_password}
        onChange={e => setForm(f => ({ ...f, new_password: e.target.value }))}
        error={!!fieldErrors.new_password}
        helperText={fieldErrors.new_password ?? 'Minimum 8 characters'}
        fullWidth
      />
      <TextField
        label="Confirm New Password"
        type="password"
        value={form.confirm_new_password}
        onChange={e => setForm(f => ({ ...f, confirm_new_password: e.target.value }))}
        error={!!fieldErrors.confirm_new_password}
        helperText={fieldErrors.confirm_new_password}
        fullWidth
      />

      <Button
        variant="contained"
        color="warning"
        onClick={handleSubmit}
        disabled={mutation.isPending}
        sx={{ alignSelf: 'flex-start' }}
      >
        {mutation.isPending && <CircularProgress size={16} sx={{ mr: 1 }} />}
        Change Password
      </Button>
    </Stack>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const SettingsPage: React.FC = () => {
  const [tab, setTab] = useState(0);

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Typography variant="h5" fontWeight={700} mb={1}>Settings</Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Manage your profile and account security.
      </Typography>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="My Profile" />
        <Tab label="Security" />
      </Tabs>

      {tab === 0 && <ProfileTab />}
      {tab === 1 && <SecurityTab />}
    </Box>
  );
};

export default SettingsPage;
