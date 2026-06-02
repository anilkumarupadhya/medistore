import React, { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Stack, Autocomplete, CircularProgress,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { useCreatePrescription, useUpdatePrescription } from '../../../hooks/usePrescriptions';
import { useCustomerList } from '../../../hooks/useCustomers';
import type { Prescription, PrescriptionFormValues } from '../../../types/prescription';
import type { Customer } from '../../../types/customer';

interface Props {
  open: boolean;
  onClose: () => void;
  prescription?: Prescription | null;
}

const EMPTY: PrescriptionFormValues = {
  customer: null,
  doctor_name: '',
  doctor_reg_no: '',
  file_url: '',
  notes: '',
};

const PrescriptionFormDialog: React.FC<Props> = ({ open, onClose, prescription }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [form, setForm]         = useState<PrescriptionFormValues>(EMPTY);
  const [custSearch, setCustSearch] = useState('');
  const [custInput, setCustInput]   = useState('');

  const isEdit = !!prescription;

  const { data: custData, isLoading: custLoading } = useCustomerList({
    search: custSearch || undefined,
    page_size: 20,
  });
  const customers: Customer[] = custData?.results ?? [];

  const createMutation = useCreatePrescription();
  const updateMutation = useUpdatePrescription();

  useEffect(() => {
    if (open) {
      if (prescription) {
        setForm({
          customer:     prescription.customer,
          doctor_name:  prescription.doctor_name,
          doctor_reg_no: prescription.doctor_reg_no,
          file_url:     prescription.file_url,
          notes:        prescription.notes,
        });
        setCustInput(prescription.customer_name ?? '');
      } else {
        setForm(EMPTY);
        setCustInput('');
      }
    }
  }, [open, prescription]);

  const selectedCustomer = customers.find(c => c.id === form.customer) ?? null;

  const handleSubmit = () => {
    const mutation = isEdit
      ? updateMutation.mutateAsync({ id: prescription!.id, data: form })
      : createMutation.mutateAsync(form);

    mutation
      .then(() => {
        enqueueSnackbar(isEdit ? 'Prescription updated' : 'Prescription added', { variant: 'success' });
        onClose();
      })
      .catch((err: any) => {
        const msg = err?.response?.data?.error?.message ?? 'Failed to save prescription';
        enqueueSnackbar(msg, { variant: 'error' });
      });
  };

  const busy = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{isEdit ? 'Edit Prescription' : 'Add Prescription'}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Autocomplete
            options={customers}
            getOptionLabel={(c) => `${c.name} — ${c.mobile}`}
            loading={custLoading}
            inputValue={custInput}
            value={selectedCustomer}
            onInputChange={(_, v) => { setCustInput(v); setCustSearch(v); }}
            onChange={(_, v) => setForm(f => ({ ...f, customer: v?.id ?? null }))}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Customer (optional)"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {custLoading ? <CircularProgress size={16} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />
          <TextField
            label="Doctor Name"
            value={form.doctor_name}
            onChange={e => setForm(f => ({ ...f, doctor_name: e.target.value }))}
            fullWidth
          />
          <TextField
            label="Doctor Reg. No."
            value={form.doctor_reg_no}
            onChange={e => setForm(f => ({ ...f, doctor_reg_no: e.target.value }))}
            fullWidth
          />
          <TextField
            label="File URL / Image Link"
            value={form.file_url}
            onChange={e => setForm(f => ({ ...f, file_url: e.target.value }))}
            fullWidth
            placeholder="https://..."
          />
          <TextField
            label="Notes"
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            fullWidth
            multiline
            minRows={3}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={busy}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={busy}>
          {busy ? <CircularProgress size={18} sx={{ mr: 1 }} /> : null}
          {isEdit ? 'Save Changes' : 'Add Prescription'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PrescriptionFormDialog;
