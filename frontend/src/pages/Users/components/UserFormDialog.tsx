import React, { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Stack, MenuItem, Switch,
  FormControlLabel, CircularProgress, Typography,
} from '@mui/material';
import { useCreateUser, useUpdateUser } from '../../../hooks/useUsers';
import type { User } from '../../../types/auth';
import type { UserCreatePayload, UserUpdatePayload } from '../../../api/users';

const ROLES = [
  { value: 'ADMIN',             label: 'Admin' },
  { value: 'PHARMACIST',        label: 'Pharmacist' },
  { value: 'CASHIER',           label: 'Cashier' },
  { value: 'INVENTORY_MANAGER', label: 'Inventory Manager' },
];

interface Props {
  open: boolean;
  onClose: () => void;
  user?: User | null;
}

interface CreateForm {
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: string;
  password: string;
  confirm_password: string;
}

interface EditForm {
  first_name: string;
  last_name: string;
  phone: string;
  role: string;
  is_active: boolean;
}

const EMPTY_CREATE: CreateForm = {
  email: '', first_name: '', last_name: '',
  phone: '', role: 'PHARMACIST', password: '', confirm_password: '',
};

const UserFormDialog: React.FC<Props> = ({ open, onClose, user }) => {
  const isEdit = !!user;

  const [createForm, setCreateForm] = useState<CreateForm>(EMPTY_CREATE);
  const [editForm, setEditForm]     = useState<EditForm>({
    first_name: '', last_name: '', phone: '', role: 'PHARMACIST', is_active: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const busy = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (open) {
      if (user) {
        setEditForm({
          first_name: user.first_name,
          last_name:  user.last_name,
          phone:      user.phone ?? '',
          role:       user.role,
          is_active:  user.is_active,
        });
      } else {
        setCreateForm(EMPTY_CREATE);
      }
      setErrors({});
    }
  }, [open, user]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!isEdit) {
      if (!createForm.email)         errs.email = 'Required';
      if (!createForm.first_name)    errs.first_name = 'Required';
      if (!createForm.last_name)     errs.last_name = 'Required';
      if (!createForm.password)      errs.password = 'Required';
      if (createForm.password.length < 8)
        errs.password = 'Minimum 8 characters';
      if (createForm.password !== createForm.confirm_password)
        errs.confirm_password = 'Passwords do not match';
    } else {
      if (!editForm.first_name) errs.first_name = 'Required';
      if (!editForm.last_name)  errs.last_name = 'Required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    if (!isEdit) {
      createMutation.mutate(createForm as UserCreatePayload, { onSuccess: onClose });
    } else {
      updateMutation.mutate(
        { id: user!.id, data: editForm as UserUpdatePayload },
        { onSuccess: onClose },
      );
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{isEdit ? `Edit User — ${user!.full_name}` : 'Add New User'}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {!isEdit && (
            <TextField
              label="Email *"
              type="email"
              value={createForm.email}
              onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))}
              error={!!errors.email}
              helperText={errors.email}
              fullWidth
            />
          )}

          <Stack direction="row" spacing={2}>
            <TextField
              label="First Name *"
              value={isEdit ? editForm.first_name : createForm.first_name}
              onChange={e => isEdit
                ? setEditForm(f => ({ ...f, first_name: e.target.value }))
                : setCreateForm(f => ({ ...f, first_name: e.target.value }))
              }
              error={!!errors.first_name}
              helperText={errors.first_name}
              fullWidth
            />
            <TextField
              label="Last Name *"
              value={isEdit ? editForm.last_name : createForm.last_name}
              onChange={e => isEdit
                ? setEditForm(f => ({ ...f, last_name: e.target.value }))
                : setCreateForm(f => ({ ...f, last_name: e.target.value }))
              }
              error={!!errors.last_name}
              helperText={errors.last_name}
              fullWidth
            />
          </Stack>

          <TextField
            label="Phone"
            value={isEdit ? editForm.phone : createForm.phone}
            onChange={e => isEdit
              ? setEditForm(f => ({ ...f, phone: e.target.value }))
              : setCreateForm(f => ({ ...f, phone: e.target.value }))
            }
            fullWidth
          />

          <TextField
            select
            label="Role *"
            value={isEdit ? editForm.role : createForm.role}
            onChange={e => isEdit
              ? setEditForm(f => ({ ...f, role: e.target.value }))
              : setCreateForm(f => ({ ...f, role: e.target.value }))
            }
            fullWidth
          >
            {ROLES.map(r => (
              <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>
            ))}
          </TextField>

          {isEdit && (
            <FormControlLabel
              control={
                <Switch
                  checked={editForm.is_active}
                  onChange={e => setEditForm(f => ({ ...f, is_active: e.target.checked }))}
                  color="success"
                />
              }
              label={<Typography variant="body2">Account Active</Typography>}
            />
          )}

          {!isEdit && (
            <>
              <TextField
                label="Password *"
                type="password"
                value={createForm.password}
                onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))}
                error={!!errors.password}
                helperText={errors.password}
                fullWidth
              />
              <TextField
                label="Confirm Password *"
                type="password"
                value={createForm.confirm_password}
                onChange={e => setCreateForm(f => ({ ...f, confirm_password: e.target.value }))}
                error={!!errors.confirm_password}
                helperText={errors.confirm_password}
                fullWidth
              />
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={busy}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={busy}>
          {busy && <CircularProgress size={16} sx={{ mr: 1 }} />}
          {isEdit ? 'Save Changes' : 'Create User'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserFormDialog;
