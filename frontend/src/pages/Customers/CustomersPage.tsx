import React, { useState, useCallback } from 'react';
import {
  Box, Button, Typography, Card, Stack, Chip, TextField,
  IconButton, Tooltip, InputAdornment, alpha,
} from '@mui/material';
import { Add, Edit, Search, Refresh, Star } from '@mui/icons-material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { useCustomerList } from '../../hooks/useCustomers';
import type { Customer } from '../../types/customer';
import CustomerFormDialog from './components/CustomerFormDialog';
import { useAuthStore } from '../../store/authStore';

const CustomersPage: React.FC = () => {
  const { user } = useAuthStore();
  const canWrite = ['ADMIN', 'PHARMACIST', 'CASHIER', 'INVENTORY_MANAGER'].includes(user?.role ?? '');

  const [search, setSearch]         = useState('');
  const [page, setPage]             = useState(1);
  const [formOpen, setFormOpen]     = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);

  const { data, isLoading, refetch } = useCustomerList({
    search: search || undefined, page, page_size: 20,
  });

  const handleEdit = useCallback((row: Customer) => {
    setEditCustomer(row);
    setFormOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setFormOpen(false);
    setEditCustomer(null);
  }, []);

  const columns: GridColDef[] = [
    {
      field: 'name', headerName: 'Customer', flex: 1.2, minWidth: 180,
      renderCell: (p: GridRenderCellParams<Customer>) => (
        <Box>
          <Typography variant="body2" fontWeight={600}>{p.row.name}</Typography>
          <Typography variant="caption" color="text.secondary">{p.row.mobile}</Typography>
        </Box>
      ),
    },
    { field: 'email', headerName: 'Email', flex: 1, minWidth: 160,
      valueFormatter: (value: any) => value || '—' },
    {
      field: 'loyalty_points', headerName: 'Loyalty Pts', width: 120,
      renderCell: (p: GridRenderCellParams<Customer>) => (
        <Box display="flex" alignItems="center" gap={0.5}>
          <Star sx={{ fontSize: 14, color: '#f57c00' }} />
          <Typography variant="body2" fontWeight={600}>{p.value}</Typography>
        </Box>
      ),
    },
    { field: 'opening_balance', headerName: 'Balance (₹)', width: 120, type: 'number',
      valueFormatter: (value: any) => `₹${Number(value).toLocaleString('en-IN')}` },
    {
      field: 'is_active', headerName: 'Status', width: 90,
      renderCell: (p: GridRenderCellParams<Customer>) => (
        <Chip
          label={p.value ? 'Active' : 'Inactive'}
          size="small" color={p.value ? 'success' : 'default'}
          sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }}
        />
      ),
    },
    { field: 'created_at', headerName: 'Joined', width: 120,
      valueFormatter: (value: any) => value ? new Date(value).toLocaleDateString('en-IN') : '—' },
    ...(canWrite ? [{
      field: 'actions', headerName: '', width: 60, sortable: false,
      renderCell: (p: GridRenderCellParams<Customer>) => (
        <Tooltip title="Edit">
          <IconButton size="small" onClick={() => handleEdit(p.row)}>
            <Edit fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    }] : []),
  ];

  const rows       = data?.results ?? [];
  const totalCount = data?.count ?? 0;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2.5}>
        <Box>
          <Typography variant="h5" fontWeight={800}>Customer Management</Typography>
          <Typography variant="body2" color="text.secondary">{totalCount} customers total</Typography>
        </Box>
        {canWrite && (
          <Button startIcon={<Add />} variant="contained" onClick={() => setFormOpen(true)}>
            Add Customer
          </Button>
        )}
      </Box>

      <Card sx={{ p: 2, mb: 2, borderRadius: 2 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <TextField
            placeholder="Search name, mobile, email…"
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

      <CustomerFormDialog open={formOpen} onClose={handleClose} customer={editCustomer} />
    </Box>
  );
};

export default CustomersPage;
