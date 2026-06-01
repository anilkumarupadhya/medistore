import React, { useState, useCallback } from 'react';
import {
  Box, Button, Chip, Typography, TextField, MenuItem,
  IconButton, Tooltip, Stack, Card, alpha, InputAdornment,
  ToggleButtonGroup, ToggleButton,
} from '@mui/material';
import {
  Add, Edit, DeleteOutline, Search, FileUpload,
  Inventory2, Warning, EventBusy, CheckCircle,
  FilterList, Refresh,
} from '@mui/icons-material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { useMedicineList, useDeleteMedicine } from '../../hooks/useMedicines';
import type { Medicine, MedicineCategory, MedicineFilters } from '../../types/medicine';
import { MEDICINE_CATEGORIES } from '../../types/medicine';
import MedicineFormDialog from './components/MedicineFormDialog';
import BulkImportDialog from './components/BulkImportDialog';
import { useAuthStore } from '../../store/authStore';

const CATEGORY_COLORS: Record<string, string> = {
  TABLET: '#1976d2', CAPSULE: '#7b1fa2', SYRUP: '#00897b',
  INJECTION: '#d32f2f', OINTMENT: '#f57c00', DROPS: '#0288d1',
  INHALER: '#c2185b', POWDER: '#5d4037', OTHER: '#616161',
};

const MedicinesPage: React.FC = () => {
  const { user } = useAuthStore();
  const canWrite = user?.role === 'ADMIN' || user?.role === 'INVENTORY_MANAGER';

  const [filters, setFilters] = useState<MedicineFilters>({
    page: 1, page_size: 20, ordering: 'name',
  });
  const [search, setSearch] = useState('');
  const [stockView, setStockView] = useState<'all' | 'low' | 'expiring'>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editMedicine, setEditMedicine] = useState<Medicine | null>(null);

  // Build actual query filters
  const queryFilters: MedicineFilters = {
    ...filters,
    search: search || undefined,
    low_stock: stockView === 'low' ? true : undefined,
  };

  const { data, isLoading, refetch } = useMedicineList(queryFilters);
  const deleteMutation = useDeleteMedicine();

  const handleEdit = useCallback((row: Medicine) => {
    setEditMedicine(row);
    setFormOpen(true);
  }, []);

  const handleDelete = useCallback((id: string, name: string) => {
    if (window.confirm(`Deactivate "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  }, [deleteMutation]);

  const handleFormClose = useCallback(() => {
    setFormOpen(false);
    setEditMedicine(null);
  }, []);

  const columns: GridColDef[] = [
    {
      field: 'name', headerName: 'Medicine Name', flex: 1.5, minWidth: 200,
      renderCell: (p: GridRenderCellParams<Medicine>) => (
        <Box>
          <Typography variant="body2" fontWeight={600}>{p.row.name}</Typography>
          {p.row.generic_name && (
            <Typography variant="caption" color="text.secondary">{p.row.generic_name}</Typography>
          )}
        </Box>
      ),
    },
    {
      field: 'category', headerName: 'Category', width: 120,
      renderCell: (p: GridRenderCellParams<Medicine>) => (
        <Chip
          label={p.value}
          size="small"
          sx={{
            fontWeight: 600, fontSize: '0.7rem',
            background: alpha(CATEGORY_COLORS[p.value as string] ?? '#616161', 0.12),
            color: CATEGORY_COLORS[p.value as string] ?? '#616161',
          }}
        />
      ),
    },
    { field: 'manufacturer', headerName: 'Manufacturer', width: 150, valueFormatter: (value: any) => value || '—' },
    { field: 'batch_number', headerName: 'Batch', width: 110, valueFormatter: (value: any) => value || '—' },
    {
      field: 'stock_quantity', headerName: 'Stock', width: 100, type: 'number',
      renderCell: (p: GridRenderCellParams<Medicine>) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography
            variant="body2" fontWeight={700}
            color={p.row.is_low_stock ? 'error.main' : p.row.stock_quantity === 0 ? 'error.dark' : 'text.primary'}
          >
            {p.value}
          </Typography>
          {p.row.is_low_stock && <Warning sx={{ fontSize: 14, color: 'warning.main' }} />}
        </Box>
      ),
    },
    { field: 'selling_price', headerName: 'Price (₹)', width: 100, type: 'number',
      valueFormatter: (value: any) => `₹${Number(value).toFixed(2)}` },
    { field: 'mrp', headerName: 'MRP (₹)', width: 90, type: 'number',
      valueFormatter: (value: any) => `₹${Number(value).toFixed(2)}` },
    { field: 'gst_percentage', headerName: 'GST%', width: 70, type: 'number',
      valueFormatter: (value: any) => `${value}%` },
    {
      field: 'expiry_date', headerName: 'Expiry', width: 110,
      renderCell: (p: GridRenderCellParams<Medicine>) => {
        if (!p.value) return <Typography variant="caption" color="text.disabled">—</Typography>;
        const daysLeft = Math.ceil((new Date(p.value).getTime() - Date.now()) / 86400000);
        const color = p.row.is_expired ? 'error.main' : daysLeft <= 30 ? 'warning.main' : 'text.secondary';
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {(p.row.is_expired || daysLeft <= 30) && <EventBusy sx={{ fontSize: 14, color }} />}
            <Typography variant="caption" color={color} fontWeight={daysLeft <= 30 ? 700 : 400}>
              {p.value}
            </Typography>
          </Box>
        );
      },
    },
    {
      field: 'is_prescription', headerName: 'Rx', width: 60,
      renderCell: (p: GridRenderCellParams<Medicine>) =>
        p.value ? <Chip label="Rx" size="small" color="error" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }} /> : null,
    },
    {
      field: 'is_active', headerName: 'Status', width: 80,
      renderCell: (p: GridRenderCellParams<Medicine>) => (
        <Chip
          label={p.value ? 'Active' : 'Inactive'}
          size="small"
          color={p.value ? 'success' : 'default'}
          sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }}
        />
      ),
    },
    ...(canWrite ? [{
      field: 'actions', headerName: 'Actions', width: 90, sortable: false,
      renderCell: (p: GridRenderCellParams<Medicine>) => (
        <Stack direction="row">
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => handleEdit(p.row)}>
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Deactivate">
            <IconButton size="small" color="error" onClick={() => handleDelete(p.row.id, p.row.name)}>
              <DeleteOutline fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    }] : []),
  ];

  const rows = data?.results ?? [];
  const totalCount = data?.count ?? 0;

  return (
    <Box>
      {/* ── Page header ───────────────────────────────────────────── */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2.5}>
        <Box>
          <Typography variant="h5" fontWeight={800}>Medicine Management</Typography>
          <Typography variant="body2" color="text.secondary">
            {totalCount} medicines total
          </Typography>
        </Box>
        {canWrite && (
          <Stack direction="row" spacing={1}>
            <Button startIcon={<FileUpload />} variant="outlined" onClick={() => setImportOpen(true)}>
              Bulk Import
            </Button>
            <Button startIcon={<Add />} variant="contained" onClick={() => setFormOpen(true)}>
              Add Medicine
            </Button>
          </Stack>
        )}
      </Box>

      {/* ── Summary chips ─────────────────────────────────────────── */}
      <Stack direction="row" spacing={1.5} mb={2.5} flexWrap="wrap">
        {[
          { icon: <Inventory2 />,   label: `${totalCount} Total`,      color: '#1976d2' },
          { icon: <Warning />,      label: `${data?.results.filter(m => m.is_low_stock).length ?? '—'} Low Stock`, color: '#f57c00' },
          { icon: <EventBusy />,    label: `${data?.results.filter(m => m.is_expired).length ?? '—'} Expired`,    color: '#d32f2f' },
          { icon: <CheckCircle />,  label: `${data?.results.filter(m => m.is_active).length ?? '—'} Active`,      color: '#2e7d32' },
        ].map(({ icon, label, color }) => (
          <Card key={label} sx={{ px: 2, py: 1, display: 'flex', alignItems: 'center', gap: 1, borderRadius: 2 }}>
            <Box sx={{ color, display: 'flex' }}>{icon}</Box>
            <Typography variant="body2" fontWeight={600}>{label}</Typography>
          </Card>
        ))}
      </Stack>

      {/* ── Filters toolbar ───────────────────────────────────────── */}
      <Card sx={{ p: 2, mb: 2, borderRadius: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="center" flexWrap="wrap">
          {/* Search */}
          <TextField
            placeholder="Search name, generic, barcode…"
            size="small"
            value={search}
            onChange={e => { setSearch(e.target.value); setFilters(f => ({ ...f, page: 1 })); }}
            sx={{ minWidth: 260 }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>,
            }}
          />

          {/* Category filter */}
          <TextField
            select size="small" label="Category" sx={{ minWidth: 140 }}
            value={filters.category ?? ''}
            onChange={e => setFilters(f => ({ ...f, category: e.target.value as MedicineCategory | '', page: 1 }))}
          >
            <MenuItem value="">All Categories</MenuItem>
            {MEDICINE_CATEGORIES.map(c => <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>)}
          </TextField>

          {/* Stock view toggle */}
          <ToggleButtonGroup
            size="small" exclusive
            value={stockView}
            onChange={(_, v) => { if (v) setStockView(v); }}
          >
            <ToggleButton value="all">All</ToggleButton>
            <ToggleButton value="low" sx={{ color: 'warning.main' }}>Low Stock</ToggleButton>
          </ToggleButtonGroup>

          {/* Active filter */}
          <TextField
            select size="small" label="Status" sx={{ minWidth: 110 }}
            value={filters.is_active ?? ''}
            onChange={e => setFilters(f => ({ ...f, is_active: e.target.value === '' ? '' : e.target.value === 'true', page: 1 }))}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="true">Active</MenuItem>
            <MenuItem value="false">Inactive</MenuItem>
          </TextField>

          {/* Ordering */}
          <TextField
            select size="small" label="Sort by" sx={{ minWidth: 140 }}
            value={filters.ordering ?? 'name'}
            onChange={e => setFilters(f => ({ ...f, ordering: e.target.value }))}
          >
            {[
              { value: 'name',            label: 'Name A→Z' },
              { value: '-name',           label: 'Name Z→A' },
              { value: 'stock_quantity',  label: 'Stock ↑' },
              { value: '-stock_quantity', label: 'Stock ↓' },
              { value: 'expiry_date',     label: 'Expiry ↑' },
              { value: '-selling_price',  label: 'Price ↓' },
            ].map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
          </TextField>

          <Tooltip title="Refresh">
            <IconButton size="small" onClick={() => refetch()}><Refresh fontSize="small" /></IconButton>
          </Tooltip>
        </Stack>
      </Card>

      {/* ── Data Grid ─────────────────────────────────────────────── */}
      <Card sx={{ borderRadius: 2 }}>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={isLoading}
          getRowId={r => r.id}
          rowCount={totalCount}
          paginationMode="server"
          paginationModel={{ page: (filters.page ?? 1) - 1, pageSize: filters.page_size ?? 20 }}
          onPaginationModelChange={({ page, pageSize }) =>
            setFilters(f => ({ ...f, page: page + 1, page_size: pageSize }))
          }
          pageSizeOptions={[10, 20, 50]}
          disableRowSelectionOnClick
          rowHeight={56}
          sx={{
            border: 'none',
            '& .MuiDataGrid-columnHeaders': { background: (t) => t.palette.mode === 'dark' ? '#0a1929' : '#f4f6f9', fontWeight: 700 },
            '& .MuiDataGrid-row:hover': { background: (t) => alpha(t.palette.primary.main, 0.04) },
          }}
          getRowClassName={r => r.row.is_low_stock ? 'low-stock-row' : ''}
        />
      </Card>

      {/* ── Dialogs ───────────────────────────────────────────────── */}
      <MedicineFormDialog open={formOpen} onClose={handleFormClose} medicine={editMedicine} />
      <BulkImportDialog   open={importOpen} onClose={() => setImportOpen(false)} />
    </Box>
  );
};

export default MedicinesPage;
