import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Grid, TextField, MenuItem, Typography,
  CircularProgress, Alert, Box, Chip, alpha,
} from '@mui/material';
import { Add } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useCreateTransaction } from '../../../hooks/useInventory';
import { useMedicineList } from '../../../hooks/useMedicines';
import { useQueryClient } from '@tanstack/react-query';
import type { StockTransactionForm } from '../../../types/inventory';
import { TX_TYPE_OPTIONS } from '../../../types/inventory';
import MedicineFormDialog from '../../Medicines/components/MedicineFormDialog';

interface Props {
  open: boolean;
  onClose: () => void;
  preselectedMedicineId?: string;
  defaultTxType?: string;
}

const schema = yup.object({
  medicine_id: yup.string().required('Select a medicine'),
  tx_type:     yup.string().required('Select transaction type'),
  quantity:    yup.number().min(1, 'Minimum 1').required('Required'),
  reason:      yup.string().when('tx_type', {
    is: (v: string) => ['STOCK_OUT','ADJUSTMENT','EXPIRED','DAMAGED'].includes(v),
    then: s => s.required('Reason is required for this type'),
    otherwise: s => s.optional(),
  }),
});

const EMPTY: StockTransactionForm = {
  medicine_id: '', tx_type: 'STOCK_IN', quantity: 1,
  batch_number: '', expiry_date: '', purchase_price: '', selling_price: '', reason: '',
};

const StockTransactionDialog: React.FC<Props> = ({ open, onClose, preselectedMedicineId, defaultTxType }) => {
  const mutation = useCreateTransaction();
  const qc = useQueryClient();
  const [medSearch, setMedSearch] = useState('');
  const [newMedOpen, setNewMedOpen] = useState(false);

  const { data: medData } = useMedicineList({ search: medSearch, page_size: 30, is_active: true });
  const medicines = medData?.results ?? [];

  const { control, handleSubmit, watch, reset, setValue, formState: { errors } } = useForm<StockTransactionForm>({
    resolver: yupResolver(schema) as any,
    defaultValues: { ...EMPTY, medicine_id: preselectedMedicineId ?? '' },
  });

  const txType = watch('tx_type');
  const medicineId = watch('medicine_id');
  const selectedMed = medicines.find(m => m.id === medicineId);

  const requiresReason = ['STOCK_OUT', 'ADJUSTMENT', 'EXPIRED', 'DAMAGED'].includes(txType);
  const isStockIn = txType === 'STOCK_IN' || txType === 'RETURN';

  const txOption = TX_TYPE_OPTIONS.find(t => t.value === txType);

  React.useEffect(() => {
    if (open) reset({ ...EMPTY, medicine_id: preselectedMedicineId ?? '', tx_type: defaultTxType ?? 'STOCK_IN' });
  }, [open, preselectedMedicineId, defaultTxType, reset]);

  const onSubmit = (values: StockTransactionForm) => {
    const payload: any = { ...values };
    if (!payload.expiry_date)    delete payload.expiry_date;
    if (!payload.purchase_price) delete payload.purchase_price;
    if (!payload.selling_price)  delete payload.selling_price;
    mutation.mutate(payload, { onSuccess: () => onClose() });
  };

  return (
    <>
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 700 }}>New Stock Transaction</DialogTitle>
      <DialogContent>
        <Box component="form" id="tx-form" onSubmit={handleSubmit(onSubmit)} sx={{ pt: 1 }}>
          <Grid container spacing={2}>
            {/* Medicine search */}
            <Grid item xs={12}>
              <Box display="flex" gap={1} alignItems="center" mb={1}>
                <TextField
                  label="Search Medicine"
                  size="small" sx={{ flex: 1 }}
                  value={medSearch}
                  onChange={e => setMedSearch(e.target.value)}
                  placeholder="Type to search…"
                />
                <Button
                  size="small" variant="outlined" startIcon={<Add />}
                  onClick={() => setNewMedOpen(true)}
                  sx={{ whiteSpace: 'nowrap' }}
                >
                  New Medicine
                </Button>
              </Box>
              <Controller name="medicine_id" control={control} render={({ field }) => (
                <TextField {...field} select label="Select Medicine" size="small" fullWidth required
                  error={!!errors.medicine_id} helperText={errors.medicine_id?.message}>
                  <MenuItem value="">— select —</MenuItem>
                  {medicines.map(m => (
                    <MenuItem key={m.id} value={m.id}>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{m.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Stock: {m.stock_quantity} {m.unit} | Batch: {m.batch_number || '—'}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </TextField>
              )} />
            </Grid>

            {/* Current stock info */}
            {selectedMed && (
              <Grid item xs={12}>
                <Box sx={{ p: 1.5, borderRadius: 2, background: alpha('#1976d2', 0.06), display: 'flex', gap: 2 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Current Stock</Typography>
                    <Typography variant="h6" fontWeight={800} color={selectedMed.is_low_stock ? 'error.main' : 'text.primary'}>
                      {selectedMed.stock_quantity} {selectedMed.unit}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Reorder Level</Typography>
                    <Typography variant="h6" fontWeight={700}>{selectedMed.reorder_level}</Typography>
                  </Box>
                </Box>
              </Grid>
            )}

            {/* Transaction type */}
            <Grid item xs={12} sm={6}>
              <Controller name="tx_type" control={control} render={({ field }) => (
                <TextField {...field} select label="Transaction Type" size="small" fullWidth required
                  error={!!errors.tx_type}>
                  {TX_TYPE_OPTIONS.map(t => (
                    <MenuItem key={t.value} value={t.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', background: t.color, flexShrink: 0 }} />
                        {t.label}
                      </Box>
                    </MenuItem>
                  ))}
                </TextField>
              )} />
            </Grid>

            {/* Quantity */}
            <Grid item xs={12} sm={6}>
              <Controller name="quantity" control={control} render={({ field }) => (
                <TextField {...field} label="Quantity" type="number" size="small" fullWidth required
                  error={!!errors.quantity} helperText={errors.quantity?.message}
                  inputProps={{ min: 1 }} />
              )} />
            </Grid>

            {/* Batch & expiry for stock-in */}
            {isStockIn && (
              <>
                <Grid item xs={12} sm={6}>
                  <Controller name="batch_number" control={control} render={({ field }) => (
                    <TextField {...field} label="Batch Number" size="small" fullWidth />
                  )} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller name="expiry_date" control={control} render={({ field }) => (
                    <TextField {...field} label="Expiry Date" type="date" size="small" fullWidth
                      InputLabelProps={{ shrink: true }} />
                  )} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller name="purchase_price" control={control} render={({ field }) => (
                    <TextField {...field} label="Purchase Price (₹)" type="number" size="small" fullWidth />
                  )} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller name="selling_price" control={control} render={({ field }) => (
                    <TextField {...field} label="Selling Price (₹)" type="number" size="small" fullWidth />
                  )} />
                </Grid>
              </>
            )}

            {/* Reason */}
            <Grid item xs={12}>
              <Controller name="reason" control={control} render={({ field }) => (
                <TextField {...field} label={`Reason${requiresReason ? ' *' : ''}`} size="small"
                  fullWidth multiline rows={2}
                  error={!!errors.reason} helperText={errors.reason?.message}
                  placeholder={requiresReason ? 'Required for this transaction type' : 'Optional'} />
              )} />
            </Grid>
          </Grid>

          {mutation.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {(mutation.error as any)?.response?.data?.error?.message ?? 'Transaction failed.'}
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          type="submit" form="tx-form" variant="contained"
          disabled={mutation.isPending}
          sx={{ background: txOption?.color, '&:hover': { background: txOption?.color, filter: 'brightness(0.9)' } }}
          startIcon={mutation.isPending ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {txOption?.label ?? 'Submit'}
        </Button>
      </DialogActions>
    </Dialog>

    {/* Nested dialog to create a brand-new medicine on-the-fly */}
    <MedicineFormDialog
      open={newMedOpen}
      onClose={() => setNewMedOpen(false)}
      onCreated={(id) => {
        // Invalidate medicines cache so the dropdown refreshes
        qc.invalidateQueries({ queryKey: ['medicines'] });
        // Auto-select the newly created medicine
        setValue('medicine_id', id);
        setMedSearch('');
        setNewMedOpen(false);
      }}
    />
    </>
  );
};

export default StockTransactionDialog;
