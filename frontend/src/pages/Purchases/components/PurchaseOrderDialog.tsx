import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Grid, TextField, MenuItem, Typography, Box,
  CircularProgress, Alert, IconButton, Tooltip, Divider,
  Table, TableHead, TableRow, TableCell, TableBody, alpha,
} from '@mui/material';
import { Add, DeleteOutline } from '@mui/icons-material';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { useCreatePurchase } from '../../../hooks/usePurchases';
import { useSupplierList } from '../../../hooks/useSuppliers';
import { useMedicineList } from '../../../hooks/useMedicines';
import type { PurchaseOrderForm, PurchaseItemForm } from '../../../types/purchase';
import { PAYMENT_METHOD_OPTIONS } from '../../../types/purchase';

interface Props {
  open:    boolean;
  onClose: () => void;
}

const EMPTY_ITEM: PurchaseItemForm = {
  medicine: '', batch_number: '', expiry_date: '',
  quantity: 1, free_quantity: 0,
  purchase_price: 0, selling_price: 0, mrp: 0,
  discount_pct: 0, gst_percentage: 12,
};

const calcItemTotal = (item: PurchaseItemForm) => {
  const base = item.quantity * item.purchase_price * (1 - item.discount_pct / 100);
  const gst  = base * item.gst_percentage / 100;
  return Math.round((base + gst) * 100) / 100;
};

const PurchaseOrderDialog: React.FC<Props> = ({ open, onClose }) => {
  const mutation = useCreatePurchase();
  const [medSearch, setMedSearch] = useState('');

  const { data: suppData } = useSupplierList({ is_active: true, page_size: 100 });
  const suppliers = suppData?.results ?? [];

  const { data: medData } = useMedicineList({ search: medSearch, page_size: 30, is_active: true });
  const medicines = medData?.results ?? [];

  const { control, handleSubmit, watch, reset, formState: { errors } } =
    useForm<PurchaseOrderForm>({
      defaultValues: {
        supplier: '', invoice_number: '', invoice_date: '',
        discount_amount: 0, amount_paid: 0, payment_method: '', notes: '',
        items: [{ ...EMPTY_ITEM }],
      },
    });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const watchedItems = watch('items');
  const watchedDiscount = watch('discount_amount');

  React.useEffect(() => {
    if (open) reset({
      supplier: '', invoice_number: '', invoice_date: '',
      discount_amount: 0, amount_paid: 0, payment_method: '', notes: '',
      items: [{ ...EMPTY_ITEM }],
    });
  }, [open, reset]);

  const subtotal = watchedItems.reduce((s, item) => s + calcItemTotal(item), 0);
  const total    = Math.max(0, subtotal - Number(watchedDiscount));

  const onSubmit = (values: PurchaseOrderForm) => {
    mutation.mutate(values, { onSuccess: onClose });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 700 }}>New Purchase Order</DialogTitle>
      <DialogContent>
        <Box component="form" id="po-form" onSubmit={handleSubmit(onSubmit)} sx={{ pt: 1 }}>
          <Grid container spacing={2} mb={2}>
            {/* PO header */}
            <Grid item xs={12} sm={4}>
              <Controller name="supplier" control={control} rules={{ required: 'Supplier is required' }}
                render={({ field }) => (
                  <TextField {...field} select label="Supplier *" size="small" fullWidth
                    error={!!errors.supplier} helperText={errors.supplier?.message}>
                    <MenuItem value="">— Select —</MenuItem>
                    {suppliers.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                  </TextField>
                )} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller name="invoice_number" control={control} render={({ field }) => (
                <TextField {...field} label="Invoice Number" size="small" fullWidth />
              )} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller name="invoice_date" control={control} render={({ field }) => (
                <TextField {...field} label="Invoice Date" type="date" size="small" fullWidth
                  InputLabelProps={{ shrink: true }} />
              )} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller name="payment_method" control={control} render={({ field }) => (
                <TextField {...field} select label="Payment Method" size="small" fullWidth>
                  <MenuItem value="">— Select —</MenuItem>
                  {PAYMENT_METHOD_OPTIONS.map(m => (
                    <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
                  ))}
                </TextField>
              )} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller name="discount_amount" control={control} render={({ field }) => (
                <TextField {...field} label="Discount (₹)" type="number" size="small" fullWidth
                  inputProps={{ min: 0 }} />
              )} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller name="amount_paid" control={control} render={({ field }) => (
                <TextField {...field} label="Amount Paid (₹)" type="number" size="small" fullWidth
                  inputProps={{ min: 0 }} />
              )} />
            </Grid>
            <Grid item xs={12}>
              <Controller name="notes" control={control} render={({ field }) => (
                <TextField {...field} label="Notes" size="small" fullWidth multiline rows={1} />
              )} />
            </Grid>
          </Grid>

          <Divider sx={{ mb: 2 }} />

          {/* Medicine search */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="subtitle1" fontWeight={700}>Line Items</Typography>
            <Box display="flex" gap={1} alignItems="center">
              <TextField
                label="Search Medicine" size="small" sx={{ width: 220 }}
                value={medSearch} onChange={e => setMedSearch(e.target.value)}
                placeholder="Type to search…"
              />
              <Tooltip title="Add row">
                <IconButton size="small" color="primary" onClick={() => append({ ...EMPTY_ITEM })}>
                  <Add />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 700, whiteSpace: 'nowrap', background: (t) => t.palette.mode === 'dark' ? '#0a1929' : '#f4f6f9' } }}>
                  <TableCell sx={{ minWidth: 180 }}>Medicine</TableCell>
                  <TableCell sx={{ minWidth: 110 }}>Batch</TableCell>
                  <TableCell sx={{ minWidth: 120 }}>Expiry</TableCell>
                  <TableCell sx={{ minWidth: 70 }}>Qty</TableCell>
                  <TableCell sx={{ minWidth: 70 }}>Free</TableCell>
                  <TableCell sx={{ minWidth: 100 }}>Buy Price</TableCell>
                  <TableCell sx={{ minWidth: 100 }}>Sell Price</TableCell>
                  <TableCell sx={{ minWidth: 90 }}>MRP</TableCell>
                  <TableCell sx={{ minWidth: 70 }}>Disc%</TableCell>
                  <TableCell sx={{ minWidth: 70 }}>GST%</TableCell>
                  <TableCell sx={{ minWidth: 100 }}>Total</TableCell>
                  <TableCell sx={{ width: 40 }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {fields.map((field, idx) => (
                  <TableRow key={field.id}>
                    <TableCell>
                      <Controller name={`items.${idx}.medicine`} control={control}
                        rules={{ required: true }}
                        render={({ field: f }) => (
                          <TextField
                            {...f} select size="small" fullWidth
                            error={!!(errors.items?.[idx] as any)?.medicine}
                            sx={{ minWidth: 170 }}>
                            <MenuItem value="">— select —</MenuItem>
                            {medicines.map(m => (
                              <MenuItem key={m.id} value={m.id}>
                                <Box>
                                  <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 160 }}>{m.name}</Typography>
                                  <Typography variant="caption" color="text.secondary">Stock: {m.stock_quantity}</Typography>
                                </Box>
                              </MenuItem>
                            ))}
                          </TextField>
                        )} />
                    </TableCell>
                    {(['batch_number'] as const).map(name => (
                      <TableCell key={name}>
                        <Controller name={`items.${idx}.${name}`} control={control}
                          render={({ field: f }) => <TextField {...f} size="small" sx={{ width: 100 }} />} />
                      </TableCell>
                    ))}
                    <TableCell>
                      <Controller name={`items.${idx}.expiry_date`} control={control}
                        render={({ field: f }) => (
                          <TextField {...f} type="date" size="small" sx={{ width: 130 }}
                            InputLabelProps={{ shrink: true }} />
                        )} />
                    </TableCell>
                    {(['quantity', 'free_quantity'] as const).map(name => (
                      <TableCell key={name}>
                        <Controller name={`items.${idx}.${name}`} control={control}
                          render={({ field: f }) => (
                            <TextField {...f} type="number" size="small" sx={{ width: 65 }}
                              inputProps={{ min: 0 }} />
                          )} />
                      </TableCell>
                    ))}
                    {(['purchase_price', 'selling_price', 'mrp'] as const).map(name => (
                      <TableCell key={name}>
                        <Controller name={`items.${idx}.${name}`} control={control}
                          render={({ field: f }) => (
                            <TextField {...f} type="number" size="small" sx={{ width: 90 }}
                              inputProps={{ min: 0, step: '0.01' }} />
                          )} />
                      </TableCell>
                    ))}
                    {(['discount_pct', 'gst_percentage'] as const).map(name => (
                      <TableCell key={name}>
                        <Controller name={`items.${idx}.${name}`} control={control}
                          render={({ field: f }) => (
                            <TextField {...f} type="number" size="small" sx={{ width: 65 }}
                              inputProps={{ min: 0, max: 100 }} />
                          )} />
                      </TableCell>
                    ))}
                    <TableCell>
                      <Typography variant="body2" fontWeight={700}>
                        ₹{calcItemTotal(watchedItems[idx] ?? EMPTY_ITEM).toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" color="error" disabled={fields.length === 1}
                        onClick={() => remove(idx)}>
                        <DeleteOutline fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>

          {/* Totals */}
          <Box display="flex" justifyContent="flex-end" mt={2} gap={3}>
            <Box textAlign="right">
              <Typography variant="body2" color="text.secondary">Subtotal</Typography>
              <Typography variant="body2" color="text.secondary">Discount</Typography>
              <Typography variant="subtitle1" fontWeight={800} color="primary.main">Total</Typography>
            </Box>
            <Box textAlign="right" minWidth={100}>
              <Typography variant="body2">₹{subtotal.toFixed(2)}</Typography>
              <Typography variant="body2">₹{Number(watchedDiscount).toFixed(2)}</Typography>
              <Typography variant="subtitle1" fontWeight={800} color="primary.main">₹{total.toFixed(2)}</Typography>
            </Box>
          </Box>

          {mutation.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {(mutation.error as any)?.response?.data?.error?.message ?? 'Failed to create order.'}
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" form="po-form" variant="contained"
          disabled={mutation.isPending}
          startIcon={mutation.isPending ? <CircularProgress size={16} color="inherit" /> : null}>
          Create Purchase Order
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PurchaseOrderDialog;
