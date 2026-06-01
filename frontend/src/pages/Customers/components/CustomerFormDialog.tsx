import React, { useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Grid, TextField, FormControlLabel, Switch,
  CircularProgress,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useCreateCustomer, useUpdateCustomer } from '../../../hooks/useCustomers';
import type { Customer, CustomerFormValues } from '../../../types/customer';

interface Props {
  open:      boolean;
  onClose:   () => void;
  customer?: Customer | null;
}

const schema = yup.object({
  name:   yup.string().required('Name is required'),
  mobile: yup.string().required('Mobile is required'),
});

const EMPTY: CustomerFormValues = {
  name: '', mobile: '', email: '', address: '',
  date_of_birth: '', opening_balance: 0, is_active: true, notes: '',
};

const CustomerFormDialog: React.FC<Props> = ({ open, onClose, customer }) => {
  const isEdit       = !!customer;
  const createMut    = useCreateCustomer();
  const updateMut    = useUpdateCustomer();
  const isPending    = createMut.isPending || updateMut.isPending;

  const { control, handleSubmit, reset, formState: { errors } } = useForm<CustomerFormValues>({
    resolver: yupResolver(schema) as any,
    defaultValues: EMPTY,
  });

  useEffect(() => {
    if (open) {
      reset(customer
        ? { ...customer, email: customer.email ?? '', date_of_birth: customer.date_of_birth ?? '',
            opening_balance: Number(customer.opening_balance) }
        : EMPTY
      );
    }
  }, [open, customer, reset]);

  const onSubmit = (values: CustomerFormValues) => {
    const payload: any = { ...values };
    if (!payload.email)         delete payload.email;
    if (!payload.date_of_birth) delete payload.date_of_birth;

    const done = () => onClose();
    if (isEdit) {
      updateMut.mutate({ id: customer!.id, data: payload }, { onSuccess: done });
    } else {
      createMut.mutate(payload, { onSuccess: done });
    }
  };

  const F = ({ name, label, type = 'text', required = false }: any) => (
    <Controller name={name} control={control} render={({ field }) => (
      <TextField {...field} label={label} type={type} required={required}
        fullWidth size="small"
        error={!!(errors as any)[name]}
        helperText={(errors as any)[name]?.message}
        InputLabelProps={type === 'date' ? { shrink: true } : undefined}
      />
    )} />
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 700 }}>
        {isEdit ? 'Edit Customer' : 'Add New Customer'}
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <Grid container spacing={2} component="form" id="customer-form"
          onSubmit={handleSubmit(onSubmit)}>
          <Grid item xs={12} sm={6}><F name="name"   label="Full Name"   required /></Grid>
          <Grid item xs={12} sm={6}><F name="mobile" label="Mobile"      required /></Grid>
          <Grid item xs={12} sm={6}><F name="email"  label="Email"       type="email" /></Grid>
          <Grid item xs={12} sm={6}><F name="date_of_birth" label="Date of Birth" type="date" /></Grid>
          <Grid item xs={12}><F name="address" label="Address" /></Grid>
          <Grid item xs={12} sm={6}>
            <F name="opening_balance" label="Opening Balance (₹)" type="number" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Controller name="is_active" control={control} render={({ field }) => (
              <FormControlLabel
                control={<Switch checked={field.value} onChange={e => field.onChange(e.target.checked)} />}
                label="Active"
              />
            )} />
          </Grid>
          <Grid item xs={12}><F name="notes" label="Notes" /></Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={onClose} disabled={isPending}>Cancel</Button>
        <Button type="submit" form="customer-form" variant="contained" disabled={isPending}
          startIcon={isPending ? <CircularProgress size={16} color="inherit" /> : null}>
          {isEdit ? 'Save Changes' : 'Add Customer'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CustomerFormDialog;
