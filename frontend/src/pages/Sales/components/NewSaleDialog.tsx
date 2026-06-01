import React, { useState, useMemo } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Box, Typography, Grid, TextField, MenuItem, Autocomplete,
  IconButton, Tooltip, Divider, Alert, alpha, CircularProgress,
  Table, TableHead, TableRow, TableCell, TableBody,
} from '@mui/material';
import { Add, DeleteOutline, ShoppingCart } from '@mui/icons-material';
import { useMedicineList } from '../../../hooks/useMedicines';
import { useCustomerList } from '../../../hooks/useCustomers';
import { useCreateSale } from '../../../hooks/useSales';
import type { Medicine } from '../../../types/medicine';
import type { Customer } from '../../../types/customer';
import type { SaleItemForm, SalePaymentMethod } from '../../../types/sale';
import { SALE_PAYMENT_METHOD_OPTIONS } from '../../../types/sale';

interface Props {
  open:    boolean;
  onClose: () => void;
}

const EMPTY_ITEM = (med: Medicine): SaleItemForm => ({
  medicine_id:    med.id,
  medicine_name:  med.name,
  unit_price:     Number(med.selling_price),
  mrp:            Number(med.mrp),
  gst_percentage: Number(med.gst_percentage),
  batch_number:   med.batch_number,
  quantity:       1,
  discount_pct:   0,
});

const calcItem = (item: SaleItemForm) => {
  const base     = item.unit_price * item.quantity;
  const discAmt  = base * (item.discount_pct / 100);
  const taxable  = base - discAmt;
  const gstAmt   = taxable * (item.gst_percentage / 100);
  return { taxable, gstAmt, total: taxable + gstAmt };
};

const NewSaleDialog: React.FC<Props> = ({ open, onClose }) => {
  const createSale = useCreateSale();

  const [medSearch, setMedSearch]       = useState('');
  const [custSearch, setCustSearch]     = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [cart, setCart]                 = useState<SaleItemForm[]>([]);
  const [discountOrder, setDiscountOrder] = useState(0);
  const [amountPaid, setAmountPaid]     = useState(0);
  const [payMethod, setPayMethod]       = useState<SalePaymentMethod>('CASH');
  const [notes, setNotes]               = useState('');

  const { data: medData }  = useMedicineList({ search: medSearch, page_size: 30, is_active: true });
  const { data: custData } = useCustomerList({ search: custSearch, page_size: 20, is_active: true });
  const medicines  = medData?.results  ?? [];
  const customers  = custData?.results ?? [];

  // Totals
  const { subtotal, taxTotal, totalAmount, changeAmount } = useMemo(() => {
    let sub = 0, tax = 0;
    cart.forEach(item => {
      const { taxable, gstAmt } = calcItem(item);
      sub += taxable;
      tax += gstAmt;
    });
    const total  = Math.max(0, sub + tax - discountOrder);
    const change = Math.max(0, amountPaid - total);
    return { subtotal: sub, taxTotal: tax, totalAmount: total, changeAmount: change };
  }, [cart, discountOrder, amountPaid]);

  const addMedicine = (med: Medicine | null) => {
    if (!med) return;
    if (med.stock_quantity <= 0) return;
    const existing = cart.findIndex(i => i.medicine_id === med.id);
    if (existing >= 0) {
      setCart(prev => prev.map((it, idx) =>
        idx === existing ? { ...it, quantity: it.quantity + 1 } : it
      ));
    } else {
      setCart(prev => [...prev, EMPTY_ITEM(med)]);
    }
    setMedSearch('');
  };

  const updateItem = (idx: number, field: keyof SaleItemForm, value: any) => {
    setCart(prev => prev.map((it, i) => i === idx ? { ...it, [field]: Number(value) } : it));
  };

  const removeItem = (idx: number) => setCart(prev => prev.filter((_, i) => i !== idx));

  const handleClose = () => {
    setCart([]); setSelectedCustomer(null); setMedSearch(''); setCustSearch('');
    setDiscountOrder(0); setAmountPaid(0); setPayMethod('CASH'); setNotes('');
    onClose();
  };

  const handleSubmit = () => {
    const payload = {
      customer_id:     selectedCustomer?.id ?? undefined,
      items:           cart.map(i => ({
        medicine_id:  i.medicine_id,
        quantity:     i.quantity,
        unit_price:   i.unit_price,
        discount_pct: i.discount_pct,
      })),
      discount_amount: discountOrder,
      amount_paid:     amountPaid,
      payment_method:  payMethod,
      notes,
    };
    createSale.mutate(payload as any, { onSuccess: handleClose });
  };

  const canSubmit = cart.length > 0 && amountPaid >= 0 && !createSale.isPending;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
        <ShoppingCart color="primary" /> New Sale / Billing
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        <Grid container spacing={2.5}>
          {/* ── Left: customer + medicine search + cart ─────────── */}
          <Grid item xs={12} md={8}>
            {/* Customer */}
            <Autocomplete
              options={customers}
              getOptionLabel={o => `${o.name} — ${o.mobile}`}
              value={selectedCustomer}
              onChange={(_, v) => setSelectedCustomer(v)}
              inputValue={custSearch}
              onInputChange={(_, v) => setCustSearch(v)}
              size="small"
              sx={{ mb: 2 }}
              renderInput={params => <TextField {...params} label="Customer (optional — walk-in allowed)" />}
            />

            {/* Medicine search */}
            <Autocomplete
              options={medicines}
              getOptionLabel={o => o.name}
              value={null}
              onChange={(_, v) => addMedicine(v)}
              inputValue={medSearch}
              onInputChange={(_, v) => setMedSearch(v)}
              size="small"
              sx={{ mb: 2 }}
              renderInput={params => (
                <TextField {...params} label="Search & add medicine…"
                  InputProps={{ ...params.InputProps, startAdornment: <Add sx={{ ml: 0.5, color: 'text.secondary' }} /> }}
                />
              )}
              renderOption={(props, o) => (
                <Box component="li" {...props} key={o.id}>
                  <Box flexGrow={1}>
                    <Typography variant="body2" fontWeight={600}>{o.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Stock: {o.stock_quantity} {o.unit} · ₹{Number(o.selling_price).toFixed(2)}
                      {o.stock_quantity <= 0 && ' · OUT OF STOCK'}
                    </Typography>
                  </Box>
                </Box>
              )}
              filterOptions={(opts) => opts.filter(o => o.stock_quantity > 0)}
            />

            {/* Cart table */}
            {cart.length === 0 ? (
              <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary',
                border: '2px dashed', borderColor: 'divider', borderRadius: 2 }}>
                <ShoppingCart sx={{ fontSize: 40, mb: 1, opacity: 0.3 }} />
                <Typography variant="body2">Search and add medicines above</Typography>
              </Box>
            ) : (
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ background: (t) => t.palette.mode === 'dark' ? '#0a1929' : '#f4f6f9' }}>
                      {['Medicine', 'Qty', 'Unit Price ₹', 'Disc %', 'GST %', 'Total ₹', ''].map(h => (
                        <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.72rem' }}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {cart.map((item, idx) => {
                      const { total } = calcItem(item);
                      return (
                        <TableRow key={idx}>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>{item.medicine_name}</Typography>
                            {item.batch_number && (
                              <Typography variant="caption" color="text.secondary">Batch: {item.batch_number}</Typography>
                            )}
                          </TableCell>
                          <TableCell sx={{ width: 70 }}>
                            <TextField
                              type="number" size="small" value={item.quantity}
                              onChange={e => updateItem(idx, 'quantity', Math.max(1, Number(e.target.value)))}
                              inputProps={{ min: 1, style: { width: 54, padding: '4px 6px' } }}
                            />
                          </TableCell>
                          <TableCell sx={{ width: 110 }}>
                            <TextField
                              type="number" size="small" value={item.unit_price}
                              onChange={e => updateItem(idx, 'unit_price', e.target.value)}
                              inputProps={{ min: 0, step: '0.01', style: { width: 80, padding: '4px 6px' } }}
                            />
                          </TableCell>
                          <TableCell sx={{ width: 80 }}>
                            <TextField
                              type="number" size="small" value={item.discount_pct}
                              onChange={e => updateItem(idx, 'discount_pct', Math.min(100, Number(e.target.value)))}
                              inputProps={{ min: 0, max: 100, style: { width: 56, padding: '4px 6px' } }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">{item.gst_percentage}%</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={700}>
                              ₹{total.toFixed(2)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Tooltip title="Remove">
                              <IconButton size="small" color="error" onClick={() => removeItem(idx)}>
                                <DeleteOutline fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Box>
            )}
          </Grid>

          {/* ── Right: totals + payment ──────────────────────────── */}
          <Grid item xs={12} md={4}>
            <Box sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle1" fontWeight={700} mb={1.5}>Order Summary</Typography>

              <Box display="flex" justifyContent="space-between" mb={0.5}>
                <Typography variant="body2" color="text.secondary">Subtotal</Typography>
                <Typography variant="body2">₹{subtotal.toFixed(2)}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={0.5}>
                <Typography variant="body2" color="text.secondary">GST</Typography>
                <Typography variant="body2">₹{taxTotal.toFixed(2)}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="body2" color="text.secondary">Order Discount</Typography>
                <TextField
                  type="number" size="small" value={discountOrder}
                  onChange={e => setDiscountOrder(Math.max(0, Number(e.target.value)))}
                  inputProps={{ min: 0, step: '0.01', style: { width: 80, padding: '4px 6px', textAlign: 'right' } }}
                  InputProps={{ startAdornment: <Typography variant="caption" sx={{ mr: 0.5 }}>₹</Typography> }}
                />
              </Box>
              <Divider sx={{ my: 1 }} />
              <Box display="flex" justifyContent="space-between" mb={2}>
                <Typography variant="subtitle1" fontWeight={800}>Total</Typography>
                <Typography variant="subtitle1" fontWeight={800} color="primary.main">
                  ₹{totalAmount.toFixed(2)}
                </Typography>
              </Box>

              {/* Payment method */}
              <TextField
                select fullWidth size="small" label="Payment Method" sx={{ mb: 1.5 }}
                value={payMethod}
                onChange={e => setPayMethod(e.target.value as SalePaymentMethod)}
              >
                {SALE_PAYMENT_METHOD_OPTIONS.map(o => (
                  <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                ))}
              </TextField>

              {/* Amount paid */}
              <TextField
                fullWidth size="small" label="Amount Paid (₹)" type="number" sx={{ mb: 1 }}
                value={amountPaid}
                onChange={e => setAmountPaid(Math.max(0, Number(e.target.value)))}
                inputProps={{ min: 0, step: '0.01' }}
              />

              {/* Change */}
              <Box sx={{ p: 1.5, borderRadius: 1.5, mb: 1.5,
                background: (t) => alpha(changeAmount > 0 ? '#2e7d32' : t.palette.action.hover, changeAmount > 0 ? 0.08 : 1) }}>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">Change to Return</Typography>
                  <Typography variant="body2" fontWeight={700} color={changeAmount > 0 ? 'success.main' : 'text.primary'}>
                    ₹{changeAmount.toFixed(2)}
                  </Typography>
                </Box>
              </Box>

              {/* Notes */}
              <TextField
                fullWidth size="small" label="Notes" multiline rows={2}
                value={notes} onChange={e => setNotes(e.target.value)}
              />
            </Box>
          </Grid>
        </Grid>

        {createSale.isError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {(createSale.error as any)?.response?.data?.error?.message ?? 'Failed to create sale.'}
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          variant="contained" onClick={handleSubmit} disabled={!canSubmit}
          startIcon={createSale.isPending ? <CircularProgress size={16} color="inherit" /> : <ShoppingCart />}
        >
          {createSale.isPending ? 'Processing…' : `Bill  ₹${totalAmount.toFixed(2)}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NewSaleDialog;
