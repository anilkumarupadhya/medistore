import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Box, Typography, Chip, alpha, CircularProgress,
} from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { useMedicineHistory } from '../../../hooks/useInventory';
import type { Medicine } from '../../../types/medicine';

const TX_COLOR: Record<string, string> = {
  STOCK_IN: '#2e7d32', STOCK_OUT: '#d32f2f', ADJUSTMENT: '#f57c00',
  RETURN: '#1976d2', EXPIRED: '#7b1fa2', DAMAGED: '#795548',
};

interface Props {
  open:     boolean;
  onClose:  () => void;
  medicine: Medicine | null;
}

const MedicineHistoryDialog: React.FC<Props> = ({ open, onClose, medicine }) => {
  const { data, isLoading } = useMedicineHistory(medicine?.id ?? '');
  const transactions = (data as any)?.results ?? (data as any)?.data ?? [];

  const columns: GridColDef[] = [
    {
      field: 'tx_type', headerName: 'Type', width: 130,
      renderCell: (p: GridRenderCellParams) => (
        <Chip
          label={p.value?.replace('_', ' ')}
          size="small"
          sx={{
            fontWeight: 700, fontSize: '0.7rem',
            background: alpha(TX_COLOR[p.value as string] ?? '#616161', 0.12),
            color: TX_COLOR[p.value as string] ?? '#616161',
          }}
        />
      ),
    },
    {
      field: 'quantity', headerName: 'Qty', width: 80,
      renderCell: (p: GridRenderCellParams) => {
        const isIn = ['STOCK_IN', 'RETURN'].includes(p.row.tx_type);
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {isIn
              ? <TrendingUp sx={{ fontSize: 14, color: 'success.main' }} />
              : <TrendingDown sx={{ fontSize: 14, color: 'error.main' }} />}
            <Typography variant="body2" fontWeight={700}
              color={isIn ? 'success.main' : 'error.main'}>
              {isIn ? '+' : '-'}{p.value}
            </Typography>
          </Box>
        );
      },
    },
    {
      field: 'quantity_before', headerName: 'Before', width: 80,
      renderCell: (p: GridRenderCellParams) =>
        <Typography variant="body2" color="text.secondary">{p.value}</Typography>,
    },
    {
      field: 'quantity_after', headerName: 'After', width: 80,
      renderCell: (p: GridRenderCellParams) =>
        <Typography variant="body2" fontWeight={700}>{p.value}</Typography>,
    },
    { field: 'batch_number', headerName: 'Batch', width: 110,
      valueFormatter: (v: any) => v || '—' },
    { field: 'reason', headerName: 'Reason', flex: 1, minWidth: 130,
      valueFormatter: (v: any) => v || '—' },
    { field: 'created_by_name', headerName: 'By', width: 120,
      valueFormatter: (v: any) => v || '—' },
    {
      field: 'created_at', headerName: 'Date', width: 155,
      valueFormatter: (v: any) => v ? new Date(v).toLocaleString('en-IN') : '—',
    },
  ];

  if (!medicine) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 700 }}>
        {medicine.name}
        <Typography variant="body2" color="text.secondary">
          {medicine.generic_name && `${medicine.generic_name} · `}
          {medicine.category} · Stock: <strong>{medicine.stock_quantity} {medicine.unit}</strong>
          {medicine.is_low_stock && (
            <Chip label="Low Stock" size="small" color="warning" sx={{ ml: 1, height: 18, fontSize: '0.65rem' }} />
          )}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ px: 2 }}>
        {/* Medicine info strip */}
        <Box sx={{ display: 'flex', gap: 3, p: 1.5, mb: 2, borderRadius: 2,
          background: (t) => alpha(t.palette.primary.main, 0.05) }}>
          {[
            { label: 'Current Stock', value: `${medicine.stock_quantity} ${medicine.unit}`,
              color: medicine.is_low_stock ? 'error.main' : 'text.primary' },
            { label: 'Reorder Level', value: medicine.reorder_level },
            { label: 'Purchase Price', value: `₹${Number(medicine.purchase_price).toFixed(2)}` },
            { label: 'Selling Price',  value: `₹${Number(medicine.selling_price).toFixed(2)}` },
            { label: 'Batch',          value: medicine.batch_number || '—' },
            { label: 'Expiry',         value: medicine.expiry_date || '—' },
          ].map(({ label, value, color }) => (
            <Box key={label}>
              <Typography variant="caption" color="text.secondary">{label}</Typography>
              <Typography variant="body2" fontWeight={700} color={(color as any) ?? 'text.primary'}>
                {value}
              </Typography>
            </Box>
          ))}
        </Box>

        {isLoading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : (
          <DataGrid
            rows={transactions}
            columns={columns}
            disableRowSelectionOnClick
            rowHeight={52}
            autoHeight
            pageSizeOptions={[10, 25, 50]}
            initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
            sx={{
              border: 'none',
              '& .MuiDataGrid-columnHeaders': {
                background: (t) => t.palette.mode === 'dark' ? '#0a1929' : '#f4f6f9',
                fontWeight: 700,
              },
            }}
          />
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined">Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default MedicineHistoryDialog;
