import React, { useState } from 'react';
import {
  Box, Button, Typography, Card, Grid, Stack, Chip,
  TextField, MenuItem, IconButton, Tooltip, alpha,
} from '@mui/material';
import { Add, Refresh, PointOfSale } from '@mui/icons-material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { useSaleList, useSaleSummary } from '../../hooks/useSales';
import type { Sale, SaleStatus } from '../../types/sale';
import { SALE_STATUS_OPTIONS, SALE_PAYMENT_STATUS_COLOR } from '../../types/sale';
import NewSaleDialog    from './components/NewSaleDialog';
import SaleDetailDialog from './components/SaleDetailDialog';
import { useAuthStore } from '../../store/authStore';

const SalesPage: React.FC = () => {
  const { user } = useAuthStore();
  const canWrite = ['ADMIN', 'PHARMACIST', 'CASHIER', 'INVENTORY_MANAGER'].includes(user?.role ?? '');

  const [newSaleOpen, setNewSaleOpen] = useState(false);
  const [detailId, setDetailId]       = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<SaleStatus | ''>('');
  const [dateFrom, setDateFrom]         = useState('');
  const [dateTo, setDateTo]             = useState('');
  const [page, setPage]                 = useState(1);

  const { data, isLoading, refetch } = useSaleList({
    status:    statusFilter || undefined,
    date_from: dateFrom || undefined,
    date_to:   dateTo || undefined,
    page,
    page_size: 20,
  });

  const { data: summary } = useSaleSummary();

  const columns: GridColDef[] = [
    {
      field: 'invoice_number', headerName: 'Invoice', width: 170,
      renderCell: (p: GridRenderCellParams<Sale>) => (
        <Typography
          variant="body2" fontWeight={700} color="primary.main"
          sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
          onClick={() => setDetailId(p.row.id)}
        >
          {p.value}
        </Typography>
      ),
    },
    { field: 'customer_name', headerName: 'Customer', flex: 1, minWidth: 150,
      valueFormatter: (value: any) => value || 'Walk-in' },
    {
      field: 'status', headerName: 'Status', width: 120,
      renderCell: (p: GridRenderCellParams<Sale>) => {
        const opt = SALE_STATUS_OPTIONS.find(o => o.value === p.value);
        return (
          <Chip label={opt?.label ?? p.value} size="small"
            sx={{ fontWeight: 700, fontSize: '0.7rem',
              background: alpha(opt?.color ?? '#616161', 0.12),
              color: opt?.color ?? '#616161' }}
          />
        );
      },
    },
    { field: 'item_count', headerName: 'Items', width: 70, type: 'number' },
    { field: 'total_amount', headerName: 'Total (₹)', width: 120, type: 'number',
      valueFormatter: (value: any) => `₹${Number(value).toLocaleString('en-IN')}` },
    { field: 'amount_paid', headerName: 'Paid (₹)', width: 110, type: 'number',
      valueFormatter: (value: any) => `₹${Number(value).toLocaleString('en-IN')}` },
    {
      field: 'payment_status', headerName: 'Payment', width: 100,
      renderCell: (p: GridRenderCellParams<Sale>) => (
        <Chip label={p.value} size="small"
          sx={{ fontWeight: 700, fontSize: '0.7rem',
            background: alpha(SALE_PAYMENT_STATUS_COLOR[p.value as keyof typeof SALE_PAYMENT_STATUS_COLOR] ?? '#616161', 0.12),
            color: SALE_PAYMENT_STATUS_COLOR[p.value as keyof typeof SALE_PAYMENT_STATUS_COLOR] ?? '#616161' }}
        />
      ),
    },
    { field: 'payment_method', headerName: 'Method', width: 100,
      valueFormatter: (value: any) => value || '—' },
    { field: 'created_by_name', headerName: 'Billed By', width: 120,
      valueFormatter: (value: any) => value || '—' },
    { field: 'created_at', headerName: 'Date', width: 145,
      valueFormatter: (value: any) => value ? new Date(value).toLocaleString('en-IN') : '—' },
  ];

  const rows       = data?.results ?? [];
  const totalCount = data?.count ?? 0;

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2.5}>
        <Box>
          <Typography variant="h5" fontWeight={800}>Sales & Billing</Typography>
          <Typography variant="body2" color="text.secondary">
            POS billing, invoices and sales history
          </Typography>
        </Box>
        {canWrite && (
          <Button startIcon={<PointOfSale />} variant="contained"
            onClick={() => setNewSaleOpen(true)}>
            New Sale
          </Button>
        )}
      </Box>

      {/* Summary cards */}
      {summary && (
        <Grid container spacing={2} mb={2.5}>
          {[
            { label: "Today's Sales",    value: summary.today_count,                                         color: '#1976d2' },
            { label: "Today's Revenue",  value: `₹${summary.today_revenue.toLocaleString('en-IN')}`,         color: '#2e7d32' },
            { label: 'This Month Sales', value: summary.month_count,                                         color: '#7b1fa2' },
            { label: 'This Month Rev.',  value: `₹${summary.month_revenue.toLocaleString('en-IN')}`,         color: '#f57c00' },
            { label: 'Total Revenue',    value: `₹${summary.total_revenue.toLocaleString('en-IN')}`,         color: '#1976d2' },
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
            select size="small" label="Status" sx={{ minWidth: 160 }}
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value as SaleStatus | ''); setPage(1); }}
          >
            <MenuItem value="">All Statuses</MenuItem>
            {SALE_STATUS_OPTIONS.map(o => (
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

      <NewSaleDialog    open={newSaleOpen} onClose={() => setNewSaleOpen(false)} />
      <SaleDetailDialog open={!!detailId} onClose={() => setDetailId(null)} saleId={detailId} />
    </Box>
  );
};

export default SalesPage;
