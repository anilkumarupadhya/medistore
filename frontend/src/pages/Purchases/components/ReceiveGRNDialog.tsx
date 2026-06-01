import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Grid, TextField, MenuItem, Typography, Box,
  CircularProgress, Alert, Table, TableHead, TableRow,
  TableCell, TableBody, Chip, alpha,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { useReceivePurchase } from '../../../hooks/usePurchases';
import type { PurchaseOrder, GRNForm } from '../../../types/purchase';
import { PAYMENT_METHOD_OPTIONS } from '../../../types/purchase';

interface Props {
  open:      boolean;
  onClose:   () => void;
  purchase:  PurchaseOrder | null;
}

const ReceiveGRNDialog: React.FC<Props> = ({ open, onClose, purchase }) => {
  const mutation = useReceivePurchase();

  const { control, handleSubmit, reset } = useForm<GRNForm>({
    defaultValues: {
      invoice_number: purchase?.invoice_number ?? '',
      invoice_date:   purchase?.invoice_date ?? '',
      amount_paid:    Number(purchase?.amount_paid ?? 0),
      payment_method: purchase?.payment_method ?? '',
      notes:          '',
    },
  });

  React.useEffect(() => {
    if (open && purchase) {
      reset({
        invoice_number: purchase.invoice_number ?? '',
        invoice_date:   purchase.invoice_date ?? '',
        amount_paid:    Number(purchase.amount_paid),
        payment_method: purchase.payment_method ?? '',
        notes:          '',
      });
    }
  }, [open, purchase, reset]);

  const onSubmit = (values: GRNForm) => {
    if (!purchase) return;
    mutation.mutate({ id: purchase.id, data: values }, { onSuccess: onClose });
  };

  if (!purchase) return null;

  const items = purchase.items ?? [];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 700 }}>
        Receive Stock — {purchase.po_number}
        <Typography variant="body2" color="text.secondary">Supplier: {purchase.supplier_name}</Typography>
      </DialogTitle>
      <DialogContent>
        {/* Items to receive */}
        <Typography variant="subtitle2" fontWeight={700} mb={1}>Items</Typography>
        <Box sx={{ overflowX: 'auto', mb: 3 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ '& th': { fontWeight: 700, background: (t) => t.palette.mode === 'dark' ? '#0a1929' : '#f4f6f9' } }}>
                <TableCell>Medicine</TableCell>
                <TableCell>Batch</TableCell>
                <TableCell>Expiry</TableCell>
                <TableCell align="right">Ordered</TableCell>
                <TableCell align="right">Free</TableCell>
                <TableCell align="right">Buy Price</TableCell>
                <TableCell align="right">Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map(item => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{item.medicine_name}</Typography>
                    <Typography variant="caption" color="text.secondary">{item.medicine_category}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{item.batch_number || '—'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{item.expiry_date || '—'}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Chip label={item.quantity} size="small"
                      sx={{ fontWeight: 700, background: alpha('#1976d2', 0.1), color: '#1976d2' }} />
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">{item.free_quantity}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">₹{Number(item.purchase_price).toFixed(2)}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={700}>
                      ₹{Number(item.total_amount).toFixed(2)}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>

        {/* Payment & invoice details */}
        <Typography variant="subtitle2" fontWeight={700} mb={1}>Payment Details</Typography>
        <Box component="form" id="grn-form" onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Controller name="invoice_number" control={control} render={({ field }) => (
                <TextField {...field} label="Invoice Number" size="small" fullWidth />
              )} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller name="invoice_date" control={control} render={({ field }) => (
                <TextField {...field} label="Invoice Date" type="date" size="small" fullWidth
                  InputLabelProps={{ shrink: true }} />
              )} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller name="amount_paid" control={control} render={({ field }) => (
                <TextField {...field} label="Amount Paid (₹)" type="number" size="small" fullWidth
                  inputProps={{ min: 0, step: '0.01' }} />
              )} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller name="payment_method" control={control} render={({ field }) => (
                <TextField {...field} select label="Payment Method" size="small" fullWidth>
                  <MenuItem value="">— Select —</MenuItem>
                  {PAYMENT_METHOD_OPTIONS.map(m => (
                    <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
                  ))}
                </TextField>
              )} />
            </Grid>
            <Grid item xs={12}>
              <Controller name="notes" control={control} render={({ field }) => (
                <TextField {...field} label="Notes" size="small" fullWidth multiline rows={2} />
              )} />
            </Grid>
          </Grid>

          <Box sx={{ mt: 2, p: 1.5, borderRadius: 2, background: alpha('#2e7d32', 0.06) }}>
            <Typography variant="body2" color="text.secondary">
              Total Order Value: <strong>₹{Number(purchase.total_amount).toLocaleString('en-IN')}</strong>
            </Typography>
            <Typography variant="caption" color="success.main" fontWeight={700}>
              Receiving this order will create STOCK_IN entries and update medicine stock automatically.
            </Typography>
          </Box>

          {mutation.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {(mutation.error as any)?.response?.data?.error?.message ?? 'Failed to receive stock.'}
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" form="grn-form" variant="contained" color="success"
          disabled={mutation.isPending}
          startIcon={mutation.isPending ? <CircularProgress size={16} color="inherit" /> : null}>
          Confirm Receipt (GRN)
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReceiveGRNDialog;
