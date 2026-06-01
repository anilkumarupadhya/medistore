import React, { useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Grid, TextField, MenuItem, FormControlLabel,
  Switch, Divider, Typography, CircularProgress, Box, Tabs, Tab,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useCreateMedicine, useUpdateMedicine } from '../../../hooks/useMedicines';
import type { Medicine, MedicineFormValues } from '../../../types/medicine';
import { MEDICINE_CATEGORIES, GST_OPTIONS, UNIT_OPTIONS } from '../../../types/medicine';

interface Props {
  open: boolean;
  onClose: () => void;
  medicine?: Medicine | null;
}

const schema = yup.object({
  name:           yup.string().required('Medicine name is required'),
  category:       yup.string().required('Category is required'),
  selling_price:  yup.number().min(0, 'Must be ≥ 0').required('Required'),
  purchase_price: yup.number().min(0, 'Must be ≥ 0').required('Required'),
  mrp:            yup.number().min(0, 'Must be ≥ 0').required('Required'),
  reorder_level:  yup.number().min(0).required('Required'),
  gst_percentage: yup.number().min(0).required('Required'),
});

const EMPTY: Partial<MedicineFormValues> = {
  name: '', generic_name: '', brand_name: '', category: 'OTHER',
  manufacturer: '', barcode: '', batch_number: '',
  purchase_price: 0, selling_price: 0, mrp: 0, gst_percentage: 12,
  hsn_code: '', reorder_level: 10, unit: 'Strip',
  manufacturing_date: '', expiry_date: '',
  is_prescription: false, is_active: true, notes: '',
};

const MedicineFormDialog: React.FC<Props> = ({ open, onClose, medicine }) => {
  const isEdit = !!medicine;
  const createMutation = useCreateMedicine();
  const updateMutation = useUpdateMedicine();
  const [tab, setTab] = React.useState(0);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<MedicineFormValues>({
    resolver: yupResolver(schema) as any,
    defaultValues: EMPTY as MedicineFormValues,
  });

  useEffect(() => {
    if (medicine) {
      reset({
        ...medicine,
        purchase_price:  Number(medicine.purchase_price),
        selling_price:   Number(medicine.selling_price),
        mrp:             Number(medicine.mrp),
        gst_percentage:  Number(medicine.gst_percentage),
        manufacturing_date: medicine.manufacturing_date ?? '',
        expiry_date:        medicine.expiry_date ?? '',
      } as any);
    } else {
      reset(EMPTY as MedicineFormValues);
    }
    setTab(0);
  }, [medicine, reset, open]);

  const isPending = createMutation.isPending || updateMutation.isPending;

  const onSubmit = (values: MedicineFormValues) => {
    // Clean empty strings to null for date fields
    const payload: any = { ...values };
    if (!payload.manufacturing_date) payload.manufacturing_date = null;
    if (!payload.expiry_date)        payload.expiry_date = null;
    if (!payload.barcode)            payload.barcode = null;

    const promise = isEdit
      ? updateMutation.mutateAsync({ id: medicine!.id, data: payload })
      : createMutation.mutateAsync(payload);

    promise.then(() => onClose()).catch(() => {});
  };

  const F = ({ name, label, type = 'text', required = false, multiline = false, rows = 1, disabled = false }: any) => (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <TextField
          {...field}
          label={label}
          type={type}
          required={required}
          multiline={multiline}
          rows={rows}
          disabled={disabled}
          fullWidth
          size="small"
          error={!!(errors as any)[name]}
          helperText={(errors as any)[name]?.message}
          InputLabelProps={type === 'date' ? { shrink: true } : undefined}
        />
      )}
    />
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
        {isEdit ? 'Edit Medicine' : 'Add New Medicine'}
      </DialogTitle>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="Basic Info" />
        <Tab label="Pricing & Tax" />
        <Tab label="Stock & Dates" />
        <Tab label="Other" />
      </Tabs>

      <DialogContent sx={{ pt: 3 }}>
        <Box component="form" id="medicine-form" onSubmit={handleSubmit(onSubmit)}>
          {/* ── Tab 0: Basic Info ── */}
          {tab === 0 && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}><F name="name"         label="Medicine Name" required /></Grid>
              <Grid item xs={12} sm={6}><F name="generic_name" label="Generic Name" /></Grid>
              <Grid item xs={12} sm={6}><F name="brand_name"   label="Brand Name" /></Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="category" control={control} render={({ field }) => (
                  <TextField {...field} label="Category" select required fullWidth size="small"
                    error={!!errors.category} helperText={errors.category?.message}>
                    {MEDICINE_CATEGORIES.map(c => <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>)}
                  </TextField>
                )} />
              </Grid>
              <Grid item xs={12} sm={6}><F name="manufacturer" label="Manufacturer" /></Grid>
              <Grid item xs={12} sm={6}><F name="barcode"      label="Barcode" /></Grid>
              <Grid item xs={12} sm={6}><F name="batch_number" label="Batch Number" /></Grid>
            </Grid>
          )}

          {/* ── Tab 1: Pricing & Tax ── */}
          {tab === 1 && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}><F name="purchase_price" label="Purchase Price (₹)" type="number" required /></Grid>
              <Grid item xs={12} sm={4}><F name="selling_price"  label="Selling Price (₹)"  type="number" required /></Grid>
              <Grid item xs={12} sm={4}><F name="mrp"            label="MRP (₹)"            type="number" required /></Grid>
              <Grid item xs={12} sm={4}>
                <Controller name="gst_percentage" control={control} render={({ field }) => (
                  <TextField {...field} label="GST %" select required fullWidth size="small"
                    error={!!errors.gst_percentage} helperText={errors.gst_percentage?.message}>
                    {GST_OPTIONS.map(g => <MenuItem key={g} value={g}>{g}%</MenuItem>)}
                  </TextField>
                )} />
              </Grid>
              <Grid item xs={12} sm={4}><F name="hsn_code" label="HSN Code" /></Grid>
            </Grid>
          )}

          {/* ── Tab 2: Stock & Dates ── */}
          {tab === 2 && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <F name="reorder_level" label="Reorder Level" type="number" required />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Controller name="unit" control={control} render={({ field }) => (
                  <TextField {...field} label="Unit" select fullWidth size="small">
                    {UNIT_OPTIONS.map(u => <MenuItem key={u} value={u}>{u}</MenuItem>)}
                  </TextField>
                )} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <F name="manufacturing_date" label="Manufacturing Date" type="date" />
              </Grid>
              <Grid item xs={12} sm={4}>
                <F name="expiry_date" label="Expiry Date" type="date" />
              </Grid>
              {isEdit && (
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Current Stock"
                    value={medicine?.stock_quantity ?? 0}
                    disabled fullWidth size="small"
                    helperText="Use Inventory > Stock In/Out to adjust"
                  />
                </Grid>
              )}
            </Grid>
          )}

          {/* ── Tab 3: Other ── */}
          {tab === 3 && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Controller name="is_prescription" control={control} render={({ field }) => (
                  <FormControlLabel
                    control={<Switch checked={field.value} onChange={e => field.onChange(e.target.checked)} />}
                    label="Prescription Required"
                  />
                )} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="is_active" control={control} render={({ field }) => (
                  <FormControlLabel
                    control={<Switch checked={field.value} onChange={e => field.onChange(e.target.checked)} />}
                    label="Active"
                  />
                )} />
              </Grid>
              <Grid item xs={12}>
                <F name="notes" label="Notes" multiline rows={4} />
              </Grid>
            </Grid>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={onClose} disabled={isPending}>Cancel</Button>
        <Button type="submit" form="medicine-form" variant="contained" disabled={isPending}
          startIcon={isPending ? <CircularProgress size={16} color="inherit" /> : null}>
          {isEdit ? 'Save Changes' : 'Add Medicine'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MedicineFormDialog;
