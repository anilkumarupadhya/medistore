import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Grid, TextField, MenuItem, Typography,
  CircularProgress, Alert, Switch, FormControlLabel,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useCreateSupplier, useUpdateSupplier } from '../../../hooks/useSuppliers';
import type { Supplier, SupplierFormValues } from '../../../types/supplier';
import { INDIAN_STATES } from '../../../types/supplier';

interface Props {
  open:      boolean;
  onClose:   () => void;
  supplier?: Supplier | null;
}

const schema = yup.object({
  name:            yup.string().required('Name is required'),
  mobile:          yup.string().required('Mobile is required').min(10, 'Invalid mobile'),
  contact_person:  yup.string().default(''),
  email:           yup.string().email('Invalid email').default(''),
  address:         yup.string().default(''),
  city:            yup.string().default(''),
  state:           yup.string().default(''),
  pincode:         yup.string().default(''),
  gst_number:      yup.string().default(''),
  payment_terms:   yup.number().min(0).default(30),
  opening_balance: yup.number().min(0).default(0),
  is_active:       yup.boolean().default(true),
  notes:           yup.string().default(''),
});

const EMPTY: SupplierFormValues = {
  name: '', contact_person: '', mobile: '', email: '',
  address: '', city: '', state: '', pincode: '',
  gst_number: '', payment_terms: 30, opening_balance: 0,
  is_active: true, notes: '',
};

const SupplierFormDialog: React.FC<Props> = ({ open, onClose, supplier }) => {
  const isEdit = !!supplier;
  const createMutation = useCreateSupplier();
  const updateMutation = useUpdateSupplier();
  const mutation = isEdit ? updateMutation : createMutation;

  const { control, handleSubmit, reset, formState: { errors } } = useForm<SupplierFormValues>({
    resolver: yupResolver(schema) as any,
    defaultValues: EMPTY,
  });

  React.useEffect(() => {
    if (open) {
      reset(supplier ? {
        name:            supplier.name,
        contact_person:  supplier.contact_person,
        mobile:          supplier.mobile,
        email:           supplier.email ?? '',
        address:         supplier.address,
        city:            supplier.city,
        state:           supplier.state,
        pincode:         supplier.pincode,
        gst_number:      supplier.gst_number ?? '',
        payment_terms:   supplier.payment_terms,
        opening_balance: Number(supplier.opening_balance),
        is_active:       supplier.is_active,
        notes:           supplier.notes,
      } : EMPTY);
    }
  }, [open, supplier, reset]);

  const onSubmit = (values: SupplierFormValues) => {
    if (isEdit) {
      (updateMutation as any).mutate({ id: supplier!.id, data: values }, { onSuccess: onClose });
    } else {
      (createMutation as any).mutate(values, { onSuccess: onClose });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 700 }}>
        {isEdit ? 'Edit Supplier' : 'Add New Supplier'}
      </DialogTitle>
      <DialogContent>
        <Box component="form" id="supplier-form" onSubmit={handleSubmit(onSubmit)} sx={{ pt: 1 }}>
          <Grid container spacing={2}>
            {/* Basic Info */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary" fontWeight={700} mb={0.5}>
                Basic Information
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller name="name" control={control} render={({ field }) => (
                <TextField {...field} label="Supplier Name *" size="small" fullWidth
                  error={!!errors.name} helperText={errors.name?.message} />
              )} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller name="contact_person" control={control} render={({ field }) => (
                <TextField {...field} label="Contact Person" size="small" fullWidth />
              )} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller name="mobile" control={control} render={({ field }) => (
                <TextField {...field} label="Mobile *" size="small" fullWidth
                  error={!!errors.mobile} helperText={errors.mobile?.message} />
              )} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller name="email" control={control} render={({ field }) => (
                <TextField {...field} label="Email" size="small" fullWidth type="email"
                  error={!!errors.email} helperText={errors.email?.message} />
              )} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller name="gst_number" control={control} render={({ field }) => (
                <TextField {...field} label="GST Number" size="small" fullWidth />
              )} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller name="payment_terms" control={control} render={({ field }) => (
                <TextField {...field} label="Payment Terms (days)" size="small" fullWidth type="number"
                  inputProps={{ min: 0 }} />
              )} />
            </Grid>

            {/* Address */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary" fontWeight={700} mb={0.5} mt={1}>
                Address
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Controller name="address" control={control} render={({ field }) => (
                <TextField {...field} label="Address" size="small" fullWidth multiline rows={2} />
              )} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller name="city" control={control} render={({ field }) => (
                <TextField {...field} label="City" size="small" fullWidth />
              )} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller name="state" control={control} render={({ field }) => (
                <TextField {...field} select label="State" size="small" fullWidth>
                  <MenuItem value="">— Select State —</MenuItem>
                  {INDIAN_STATES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </TextField>
              )} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller name="pincode" control={control} render={({ field }) => (
                <TextField {...field} label="Pincode" size="small" fullWidth />
              )} />
            </Grid>

            {/* Other */}
            <Grid item xs={12} sm={6}>
              <Controller name="opening_balance" control={control} render={({ field }) => (
                <TextField {...field} label="Opening Balance (₹)" size="small" fullWidth type="number"
                  inputProps={{ min: 0 }} />
              )} />
            </Grid>
            <Grid item xs={12} sm={6} sx={{ display: 'flex', alignItems: 'center' }}>
              <Controller name="is_active" control={control} render={({ field }) => (
                <FormControlLabel
                  control={<Switch checked={field.value} onChange={e => field.onChange(e.target.checked)} />}
                  label="Active"
                />
              )} />
            </Grid>
            <Grid item xs={12}>
              <Controller name="notes" control={control} render={({ field }) => (
                <TextField {...field} label="Notes" size="small" fullWidth multiline rows={2} />
              )} />
            </Grid>
          </Grid>

          {(mutation as any).isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {(mutation as any).error?.response?.data?.error?.message ?? 'An error occurred.'}
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          type="submit" form="supplier-form" variant="contained"
          disabled={(mutation as any).isPending}
          startIcon={(mutation as any).isPending ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {isEdit ? 'Save Changes' : 'Add Supplier'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

import { Box } from '@mui/material';
export default SupplierFormDialog;
