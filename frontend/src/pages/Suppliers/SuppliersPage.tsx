import React, { useState, useCallback } from 'react';
import {
  Box, Button, Typography, Card, Stack, Chip, TextField,
  IconButton, Tooltip, InputAdornment, alpha,
} from '@mui/material';
import { Add, Edit, DeleteOutline, Search, Refresh } from '@mui/icons-material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { useSupplierList, useDeactivateSupplier } from '../../hooks/useSuppliers';
import type { Supplier } from '../../types/supplier';
import SupplierFormDialog from './components/SupplierFormDialog';
import { useAuthStore } from '../../store/authStore';

const SuppliersPage: React.FC = () => {
  const { user } = useAuthStore();
  const canWrite = user?.role === 'ADMIN' || user?.role === 'INVENTORY_MANAGER';

  const [search, setSearch]         = useState('');
  const [page, setPage]             = useState(1);
  const [formOpen, setFormOpen]     = useState(false);
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null);

  const { data, isLoading, refetch } = useSupplierList({ search: search || undefined, page, page_size: 20 });
  const deactivateMutation = useDeactivateSupplier();

  const handleEdit = useCallback((row: Supplier) => {
    setEditSupplier(row);
    setFormOpen(true);
  }, []);

  const handleDeactivate = useCallback((id: string, name: string) => {
    if (window.confirm(`Deactivate supplier "${name}"?`)) {
      deactivateMutation.mutate(id);
    }
  }, [deactivateMutation]);

  const handleClose = useCallback(() => {
    setFormOpen(false);
    setEditSupplier(null);
  }, []);

  const columns: GridColDef[] = [
    {
      field: 'name', headerName: 'Supplier Name', flex: 1.2, minWidth: 180,
      renderCell: (p: GridRenderCellParams<Supplier>) => (
        <Box>
          <Typography variant="body2" fontWeight={600}>{p.row.name}</Typography>
          {p.row.contact_person && (
            <Typography variant="caption" color="text.secondary">{p.row.contact_person}</Typography>
          )}
        </Box>
      ),
    },
    { field: 'mobile', headerName: 'Mobile', width: 130 },
    { field: 'email',  headerName: 'Email',  flex: 1, minWidth: 160,
      valueFormatter: (value: any) => value || '—' },
    { field: 'city',   headerName: 'City',   width: 110,
      valueFormatter: (value: any) => value || '—' },
    { field: 'gst_number', headerName: 'GST No.', width: 150,
      valueFormatter: (value: any) => value || '—' },
    { field: 'payment_terms', headerName: 'Terms', width: 90,
      valueFormatter: (value: any) => `${value}d` },
    { field: 'opening_balance', headerName: 'Balance (₹)', width: 120, type: 'number',
      valueFormatter: (value: any) => `₹${Number(value).toLocaleString('en-IN')}` },
    {
      field: 'is_active', headerName: 'Status', width: 90,
      renderCell: (p: GridRenderCellParams<Supplier>) => (
        <Chip
          label={p.value ? 'Active' : 'Inactive'}
          size="small" color={p.value ? 'success' : 'default'}
          sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }}
        />
      ),
    },
    ...(canWrite ? [{
      field: 'actions', headerName: 'Actions', width: 90, sortable: false,
      renderCell: (p: GridRenderCellParams<Supplier>) => (
        <Stack direction="row">
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => handleEdit(p.row)}>
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Deactivate">
            <IconButton size="small" color="error" onClick={() => handleDeactivate(p.row.id, p.row.name)}>
              <DeleteOutline fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    }] : []),
  ];

  const rows       = data?.results ?? [];
  const totalCount = data?.count ?? 0;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2.5}>
        <Box>
          <Typography variant="h5" fontWeight={800}>Supplier Management</Typography>
          <Typography variant="body2" color="text.secondary">{totalCount} suppliers total</Typography>
        </Box>
        {canWrite && (
          <Button startIcon={<Add />} variant="contained" onClick={() => setFormOpen(true)}>
            Add Supplier
          </Button>
        )}
      </Box>

      <Card sx={{ p: 2, mb: 2, borderRadius: 2 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <TextField
            placeholder="Search name, mobile, GST…"
            size="small"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            sx={{ minWidth: 280 }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>,
            }}
          />
          <Tooltip title="Refresh">
            <IconButton size="small" onClick={() => refetch()}><Refresh fontSize="small" /></IconButton>
          </Tooltip>
          <Typography variant="caption" color="text.secondary" ml="auto">
            {totalCount} records
          </Typography>
        </Stack>
      </Card>

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

      <SupplierFormDialog open={formOpen} onClose={handleClose} supplier={editSupplier} />
    </Box>
  );
};

export default SuppliersPage;
