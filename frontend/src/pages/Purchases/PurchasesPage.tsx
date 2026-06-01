import React, { useState, useCallback } from 'react';
import {
  Box, Button, Typography, Card, Stack, Chip, TextField,
  MenuItem, IconButton, Tooltip, alpha, Grid,
} from '@mui/material';
import {
  Add, Refresh, LocalShipping, Cancel, Visibility,
} from '@mui/icons-material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { usePurchaseList, usePurchaseSummary, useCancelPurchase } from '../../hooks/usePurchases';
import { useSupplierList } from '../../hooks/useSuppliers';
import type { PurchaseOrder, PurchaseStatus } from '../../types/purchase';
import { PURCHASE_STATUS_OPTIONS, PAYMENT_STATUS_COLOR } from '../../types/purchase';
import PurchaseOrderDialog  from './components/PurchaseOrderDialog';
import ReceiveGRNDialog     from './components/ReceiveGRNDialog';
import PurchaseDetailDialog from './components/PurchaseDetailDialog';
import { useAuthStore } from '../../store/authStore';

const PurchasesPage: React.FC = () => {
  const { user } = useAuthStore();
  const canWrite = user?.role === 'ADMIN' || user?.role === 'INVENTORY_MANAGER';

  const [statusFilter, setStatusFilter] = useState<PurchaseStatus | ''>('');
  const [dateFrom, setDateFrom]         = useState('');
  const [dateTo, setDateTo]             = useState('');
  const [page, setPage]                 = useState(1);
  const [createOpen, setCreateOpen]     = useState(false);
  const [grnPO, setGrnPO]               = useState<PurchaseOrder | null>(null);
  const [detailId, setDetailId]         = useState<string | null>(null);

  const { data, isLoading, refetch } = usePurchaseList({
    status:    statusFilter || undefined,
    date_from: dateFrom || undefined,
    date_to:   dateTo || undefined,
    page,
    page_size: 20,
  });

  const { data: summary } = usePurchaseSummary();
  const cancelMutation    = useCancelPurchase();

  const handleCancel = useCallback((id: string, po: string) => {
    if (window.confirm(`Cancel purchase order "${po}"?`)) {
      cancelMutation.mutate(id);
    }
  }, [cancelMutation]);

  const columns: GridColDef[] = [
    {
      field: 'po_number', headerName: 'PO Number', width: 170,
      renderCell: (p: GridRenderCellParams<PurchaseOrder>) => (
        <Typography
          variant="body2" fontWeight={700} color="primary.main"
          sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
          onClick={() => setDetailId(p.row.id)}
        >
          {p.value}
        </Typography>
      ),
    },
    { field: 'supplier_name', headerName: 'Supplier', flex: 1, minWidth: 160,
      valueFormatter: (value: any) => value || '—' },
    {
      field: 'status', headerName: 'Status', width: 160,
      renderCell: (p: GridRenderCellParams<PurchaseOrder>) => {
        const opt = PURCHASE_STATUS_OPTIONS.find(o => o.value === p.value);
        return (
          <Chip
            label={opt?.label ?? p.value}
            size="small"
            sx={{
              fontWeight: 700, fontSize: '0.7rem',
              background: alpha(opt?.color ?? '#616161', 0.12),
              color: opt?.color ?? '#616161',
            }}
          />
        );
      },
    },
    { field: 'item_count', headerName: 'Items', width: 70, type: 'number' },
    { field: 'total_amount', headerName: 'Total (₹)', width: 120, type: 'number',
      valueFormatter: (value: any) => `₹${Number(value).toLocaleString('en-IN')}` },
    {
      field: 'payment_status', headerName: 'Payment', width: 110,
      renderCell: (p: GridRenderCellParams<PurchaseOrder>) => (
        <Chip
          label={p.value}
          size="small"
          sx={{
            fontWeight: 700, fontSize: '0.7rem',
            background: alpha(PAYMENT_STATUS_COLOR[p.value as keyof typeof PAYMENT_STATUS_COLOR] ?? '#616161', 0.12),
            color: PAYMENT_STATUS_COLOR[p.value as keyof typeof PAYMENT_STATUS_COLOR] ?? '#616161',
          }}
        />
      ),
    },
    { field: 'invoice_number', headerName: 'Invoice', width: 130,
      valueFormatter: (value: any) => value || '—' },
    { field: 'created_at', headerName: 'Date', width: 150,
      valueFormatter: (value: any) => value ? new Date(value).toLocaleDateString('en-IN') : '—' },
    ...(canWrite ? [{
      field: 'actions', headerName: 'Actions', width: 120, sortable: false,
      renderCell: (p: GridRenderCellParams<PurchaseOrder>) => (
        <Stack direction="row">
          {['DRAFT', 'ORDERED', 'PARTIALLY_RECEIVED'].includes(p.row.status) && (
            <Tooltip title="Receive Stock (GRN)">
              <IconButton size="small" color="success" onClick={() => setGrnPO(p.row)}>
                <LocalShipping fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {['DRAFT', 'ORDERED'].includes(p.row.status) && (
            <Tooltip title="Cancel Order">
              <IconButton size="small" color="error"
                onClick={() => handleCancel(p.row.id, p.row.po_number)}>
                <Cancel fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      ),
    }] : []),
  ];

  const rows       = data?.results ?? [];
  const totalCount = data?.count ?? 0;

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2.5}>
        <Box>
          <Typography variant="h5" fontWeight={800}>Purchase Management</Typography>
          <Typography variant="body2" color="text.secondary">
            Purchase orders, GRN and supplier invoices
          </Typography>
        </Box>
        {canWrite && (
          <Button startIcon={<Add />} variant="contained" onClick={() => setCreateOpen(true)}>
            New Purchase Order
          </Button>
        )}
      </Box>

      {/* Summary cards */}
      {summary && (
        <Grid container spacing={2} mb={2.5}>
          {[
            { label: 'Total Orders',   value: summary.total_orders,                    color: '#1976d2' },
            { label: 'Pending',        value: summary.pending_count,                   color: '#f57c00' },
            { label: 'Received',       value: summary.by_status.RECEIVED,              color: '#2e7d32' },
            { label: 'Cancelled',      value: summary.by_status.CANCELLED,             color: '#d32f2f' },
            { label: 'Total Value',    value: `₹${summary.total_value.toLocaleString('en-IN')}`, color: '#7b1fa2' },
          ].map(({ label, value, color }) => (
            <Grid item xs={6} sm={4} md={2.4} key={label}>
              <Card sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
                <Typography variant="h5" fontWeight={800} color={color}>{value}</Typography>
                <Typography variant="caption" color="text.secondary">{label}</Typography>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Filters */}
      <Card sx={{ p: 2, mb: 2, borderRadius: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="center" flexWrap="wrap">
          <TextField
            select size="small" label="Status" sx={{ minWidth: 180 }}
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value as PurchaseStatus | ''); setPage(1); }}
          >
            <MenuItem value="">All Statuses</MenuItem>
            {PURCHASE_STATUS_OPTIONS.map(o => (
              <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
            ))}
          </TextField>
          <TextField label="From" type="date" size="small" sx={{ width: 150 }}
            value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            InputLabelProps={{ shrink: true }} />
          <TextField label="To" type="date" size="small" sx={{ width: 150 }}
            value={dateTo} onChange={e => setDateTo(e.target.value)}
            InputLabelProps={{ shrink: true }} />
          <Tooltip title="Refresh">
            <IconButton size="small" onClick={() => refetch()}><Refresh fontSize="small" /></IconButton>
          </Tooltip>
          <Typography variant="caption" color="text.secondary" ml="auto">
            {totalCount} records
          </Typography>
        </Stack>
      </Card>

      {/* DataGrid */}
      <Card sx={{ borderRadius: 2 }}>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={isLoading}
          getRowId={r => r.id}
          rowCount={totalCount}
          paginationMode="server"
          paginationModel={{ page: page - 1, pageSize: 20 }}
          onPaginationModelChange={({ page: p }) => setPage(p + 1)}
          pageSizeOptions={[20]}
          disableRowSelectionOnClick
          rowHeight={56}
          sx={{
            border: 'none',
            '& .MuiDataGrid-columnHeaders': {
              background: (t) => t.palette.mode === 'dark' ? '#0a1929' : '#f4f6f9',
              fontWeight: 700,
            },
            '& .MuiDataGrid-row:hover': { background: (t) => alpha(t.palette.primary.main, 0.04) },
          }}
        />
      </Card>

      <PurchaseOrderDialog open={createOpen} onClose={() => setCreateOpen(false)} />
      <ReceiveGRNDialog    open={!!grnPO}    onClose={() => setGrnPO(null)} purchase={grnPO} />

      <PurchaseDetailDialog
        open={!!detailId}
        onClose={() => setDetailId(null)}
        purchaseId={detailId}
        canWrite={canWrite}
        onReceive={(po) => setGrnPO(po)}
        onCancel={(id, poNum) => handleCancel(id, poNum)}
      />
    </Box>
  );
};

export default PurchasesPage;
