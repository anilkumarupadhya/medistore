import React, { useState } from 'react';
import {
  Box, Typography, Button, Card, Stack, Chip, Tabs, Tab,
  Grid, TextField, Tooltip, IconButton, alpha, Autocomplete,
} from '@mui/material';
import { Add, Refresh, TrendingUp, TrendingDown, AddShoppingCart, History } from '@mui/icons-material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { useInventoryList, useInventorySummary } from '../../hooks/useInventory';
import { useMedicineList } from '../../hooks/useMedicines';
import type { InventoryTransaction } from '../../types/inventory';
import type { Medicine } from '../../types/medicine';
import { TX_TYPE_OPTIONS } from '../../types/inventory';
import StockTransactionDialog from './components/StockTransactionDialog';
import MedicineHistoryDialog from './components/MedicineHistoryDialog';
import { useAuthStore } from '../../store/authStore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer, Legend } from 'recharts';

const TX_COLOR: Record<string, string> = {
  STOCK_IN: '#2e7d32', STOCK_OUT: '#d32f2f', ADJUSTMENT: '#f57c00',
  RETURN: '#1976d2', EXPIRED: '#7b1fa2', DAMAGED: '#795548',
};

const InventoryPage: React.FC = () => {
  const { user } = useAuthStore();
  const canWrite = user?.role === 'ADMIN' || user?.role === 'INVENTORY_MANAGER';

  const [txOpen, setTxOpen] = useState(false);
  const [txDefaultType, setTxDefaultType] = useState<string | undefined>(undefined);
  const [txTypeFilter, setTxTypeFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [tabIndex, setTabIndex] = useState(0);
  const [medSearch, setMedSearch] = useState('');
  const [selectedMed, setSelectedMed] = useState<Medicine | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  const TAB_TYPES = ['', 'STOCK_IN', 'STOCK_OUT', 'ADJUSTMENT', 'RETURN', 'EXPIRED', 'DAMAGED'];

  const activeType = TAB_TYPES[tabIndex] || txTypeFilter;

  const { data: medListData } = useMedicineList({ search: medSearch, page_size: 30, is_active: true });
  const medicineOptions = medListData?.results ?? [];

  const { data, isLoading, refetch } = useInventoryList({
    tx_type:     activeType || undefined,
    medicine_id: selectedMed?.id || undefined,
    date_from:   dateFrom || undefined,
    date_to:     dateTo || undefined,
    page,
    page_size: 20,
  });

  const { data: summary } = useInventorySummary();

  const transactions = data?.results ?? [];
  const totalCount   = data?.count ?? 0;

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    {
      field: 'medicine_name', headerName: 'Medicine', flex: 1.2, minWidth: 180,
      renderCell: (p: GridRenderCellParams<InventoryTransaction>) => (
        <Box>
          <Typography variant="body2" fontWeight={600}>{p.row.medicine_name}</Typography>
          {p.row.batch_number && (
            <Typography variant="caption" color="text.secondary">Batch: {p.row.batch_number}</Typography>
          )}
        </Box>
      ),
    },
    {
      field: 'tx_type', headerName: 'Type', width: 130,
      renderCell: (p: GridRenderCellParams<InventoryTransaction>) => (
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
      field: 'quantity', headerName: 'Qty', width: 80, type: 'number',
      renderCell: (p: GridRenderCellParams<InventoryTransaction>) => {
        const isIn = ['STOCK_IN', 'RETURN'].includes(p.row.tx_type);
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {isIn
              ? <TrendingUp  sx={{ fontSize: 14, color: 'success.main' }} />
              : <TrendingDown sx={{ fontSize: 14, color: 'error.main' }} />
            }
            <Typography variant="body2" fontWeight={700}
              color={isIn ? 'success.main' : 'error.main'}>
              {isIn ? '+' : '-'}{p.value}
            </Typography>
          </Box>
        );
      },
    },
    {
      field: 'quantity_before', headerName: 'Before', width: 80, type: 'number',
      renderCell: (p: GridRenderCellParams<InventoryTransaction>) =>
        <Typography variant="body2" color="text.secondary">{p.value}</Typography>,
    },
    {
      field: 'quantity_after', headerName: 'After', width: 80, type: 'number',
      renderCell: (p: GridRenderCellParams<InventoryTransaction>) =>
        <Typography variant="body2" fontWeight={600}>{p.value}</Typography>,
    },
    { field: 'reason', headerName: 'Reason', flex: 1, minWidth: 140,
      valueFormatter: (value: any) => value || '—' },
    { field: 'created_by_name', headerName: 'By', width: 130,
      valueFormatter: (value: any) => value || '—' },
    {
      field: 'created_at', headerName: 'Date & Time', width: 160,
      valueFormatter: (value: any) => value ? new Date(value).toLocaleString('en-IN') : '—',
    },
  ];

  // Build chart data from recent transactions
  const chartData = React.useMemo(() => {
    const map: Record<string, { date: string; stock_in: number; stock_out: number }> = {};
    transactions.slice(0, 50).forEach(tx => {
      const d = new Date(tx.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      if (!map[d]) map[d] = { date: d, stock_in: 0, stock_out: 0 };
      if (tx.tx_type === 'STOCK_IN' || tx.tx_type === 'RETURN') map[d].stock_in += tx.quantity;
      else map[d].stock_out += tx.quantity;
    });
    return Object.values(map).reverse().slice(-7);
  }, [transactions]);

  return (
    <Box>
      {/* ── Header ────────────────────────────────────────────────── */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2.5}>
        <Box>
          <Typography variant="h5" fontWeight={800}>Inventory Management</Typography>
          <Typography variant="body2" color="text.secondary">
            Stock movements, adjustments, and history
          </Typography>
        </Box>
        {canWrite && (
          <Stack direction="row" spacing={1}>
            <Button
              startIcon={<AddShoppingCart />}
              variant="outlined"
              color="success"
              onClick={() => { setTxDefaultType('STOCK_IN'); setTxOpen(true); }}
            >
              Add Stock
            </Button>
            <Button
              startIcon={<Add />}
              variant="contained"
              onClick={() => { setTxDefaultType(undefined); setTxOpen(true); }}
            >
              New Transaction
            </Button>
          </Stack>
        )}
      </Box>

      {/* ── Summary cards ─────────────────────────────────────────── */}
      {summary && (
        <Grid container spacing={2} mb={2.5}>
          {[
            { label: 'Total Medicines', value: summary.total_medicines,     color: '#1976d2' },
            { label: 'Low Stock',       value: summary.low_stock_count,     color: '#f57c00' },
            { label: 'Expiring (30d)',  value: summary.expiring_soon_count, color: '#7b1fa2' },
            { label: 'Out of Stock',    value: summary.out_of_stock_count,  color: '#d32f2f' },
            { label: 'Stock Value',     value: `₹${summary.total_stock_value.toLocaleString('en-IN')}`, color: '#2e7d32' },
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

      <Grid container spacing={2.5} mb={2.5}>
        {/* ── Stock movement chart ───────────────────────────────── */}
        <Grid item xs={12} md={7}>
          <Card sx={{ p: 2.5, borderRadius: 2, height: '100%' }}>
            <Typography variant="h6" fontWeight={700} mb={2}>Stock Movement (Last 7 Days)</Typography>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <ReTooltip />
                <Legend />
                <Bar dataKey="stock_in"  name="Stock In"  fill="#2e7d32" radius={[4,4,0,0]} />
                <Bar dataKey="stock_out" name="Stock Out" fill="#d32f2f" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Grid>

        {/* ── Low stock alert list ───────────────────────────────── */}
        <Grid item xs={12} md={5}>
          <Card sx={{ p: 2.5, borderRadius: 2, height: '100%' }}>
            <Typography variant="h6" fontWeight={700} mb={1.5}>Low Stock Alert</Typography>
            {summary?.low_stock_medicines?.length === 0 && (
              <Typography variant="body2" color="text.secondary">No low stock items.</Typography>
            )}
            {summary?.low_stock_medicines?.map((m: any) => (
              <Box key={m.id} display="flex" justifyContent="space-between" alignItems="center"
                py={0.75} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                <Box>
                  <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 180 }}>{m.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{m.unit}</Typography>
                </Box>
                <Chip
                  label={`${m.stock_quantity}/${m.reorder_level}`}
                  size="small"
                  sx={{ fontWeight: 700, background: alpha('#f57c00', 0.12), color: '#f57c00' }}
                />
              </Box>
            ))}
          </Card>
        </Grid>
      </Grid>

      {/* ── Transaction list ──────────────────────────────────────── */}
      <Card sx={{ borderRadius: 2 }}>
        {/* Tabs */}
        <Tabs
          value={tabIndex}
          onChange={(_, v) => { setTabIndex(v); setPage(1); }}
          sx={{ px: 2, borderBottom: 1, borderColor: 'divider' }}
          variant="scrollable" scrollButtons="auto"
        >
          <Tab label="All" />
          {TX_TYPE_OPTIONS.map(t => (
            <Tab key={t.value} label={t.label} sx={{ color: t.color }} />
          ))}
        </Tabs>

        {/* Filter toolbar */}
        <Stack direction="row" spacing={1.5} p={2} alignItems="center" flexWrap="wrap">
          <Autocomplete
            options={medicineOptions}
            getOptionLabel={(o) => o.name}
            value={selectedMed}
            onChange={(_, v) => { setSelectedMed(v); setPage(1); }}
            inputValue={medSearch}
            onInputChange={(_, v) => setMedSearch(v)}
            size="small"
            sx={{ width: 260 }}
            renderInput={(params) => (
              <TextField {...params} label="Search Medicine" placeholder="Type to filter…" />
            )}
            renderOption={(props, o) => (
              <Box component="li" {...props} key={o.id}>
                <Box>
                  <Typography variant="body2" fontWeight={600}>{o.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Stock: {o.stock_quantity} {o.unit}
                    {o.batch_number ? ` · Batch: ${o.batch_number}` : ''}
                  </Typography>
                </Box>
              </Box>
            )}
          />
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

        {/* Selected medicine info card */}
        {selectedMed && (
          <Box sx={{ mx: 2, mb: 2, p: 2, borderRadius: 2,
            background: (t) => alpha(t.palette.primary.main, 0.05),
            border: '1px solid', borderColor: 'divider',
            display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap',
          }}>
            <Box sx={{ flex: 1, minWidth: 160 }}>
              <Typography variant="subtitle1" fontWeight={800}>{selectedMed.name}</Typography>
              {selectedMed.generic_name && (
                <Typography variant="caption" color="text.secondary">{selectedMed.generic_name}</Typography>
              )}
            </Box>
            {[
              { label: 'Stock',          value: `${selectedMed.stock_quantity} ${selectedMed.unit}`,
                color: selectedMed.is_low_stock ? 'error.main' : 'text.primary' },
              { label: 'Reorder Level',  value: selectedMed.reorder_level },
              { label: 'Purchase Price', value: `₹${Number(selectedMed.purchase_price).toFixed(2)}` },
              { label: 'Selling Price',  value: `₹${Number(selectedMed.selling_price).toFixed(2)}` },
              { label: 'Batch',          value: selectedMed.batch_number || '—' },
              { label: 'Expiry',         value: selectedMed.expiry_date  || '—' },
            ].map(({ label, value, color }) => (
              <Box key={label}>
                <Typography variant="caption" color="text.secondary">{label}</Typography>
                <Typography variant="body2" fontWeight={700} color={(color as any) ?? 'text.primary'}>
                  {value}
                </Typography>
              </Box>
            ))}
            {selectedMed.is_low_stock && (
              <Chip label="Low Stock" size="small" color="warning" sx={{ height: 20, fontSize: '0.65rem' }} />
            )}
            <Tooltip title="View full history">
              <Button
                size="small" variant="outlined" startIcon={<History />}
                onClick={() => setHistoryOpen(true)}
              >
                History
              </Button>
            </Tooltip>
          </Box>
        )}

        <DataGrid
          rows={transactions}
          columns={columns}
          loading={isLoading}
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
          }}
        />
      </Card>

      <StockTransactionDialog
        open={txOpen}
        onClose={() => setTxOpen(false)}
        defaultTxType={txDefaultType}
      />

      <MedicineHistoryDialog
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        medicine={selectedMed}
      />
    </Box>
  );
};

export default InventoryPage;
