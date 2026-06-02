import React, { useState } from 'react';
import {
  Box, Button, Typography, Stack, TextField, IconButton,
  Tooltip, Chip, Link,
} from '@mui/material';
import { Add, Refresh, Delete, Edit, Description } from '@mui/icons-material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { useSnackbar } from 'notistack';
import { usePrescriptionList, useDeletePrescription } from '../../hooks/usePrescriptions';
import type { Prescription } from '../../types/prescription';
import PrescriptionFormDialog from './components/PrescriptionFormDialog';
import { useAuthStore } from '../../store/authStore';

const PrescriptionsPage: React.FC = () => {
  const { user } = useAuthStore();
  const { enqueueSnackbar } = useSnackbar();
  const canWrite = ['ADMIN', 'PHARMACIST'].includes(user?.role ?? '');

  const [formOpen, setFormOpen]       = useState(false);
  const [editRx, setEditRx]           = useState<Prescription | null>(null);
  const [search, setSearch]           = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage]               = useState(1);

  const { data, isLoading, refetch } = usePrescriptionList({
    search:    search || undefined,
    page,
    page_size: 20,
  });

  const deleteMutation = useDeletePrescription();

  const prescriptions: Prescription[] = data?.results ?? [];
  const total = data?.count ?? 0;

  const handleDelete = (rx: Prescription) => {
    if (!window.confirm(`Delete prescription for ${rx.customer_name || 'walk-in'}?`)) return;
    deleteMutation.mutate(rx.id, {
      onSuccess: () => enqueueSnackbar('Prescription deleted', { variant: 'success' }),
      onError: () => enqueueSnackbar('Failed to delete', { variant: 'error' }),
    });
  };

  const columns: GridColDef[] = [
    {
      field: 'customer_name', headerName: 'Customer', flex: 1, minWidth: 150,
      renderCell: (p: GridRenderCellParams<Prescription>) => (
        <Typography variant="body2">{p.value || <em style={{ opacity: 0.5 }}>Walk-in</em>}</Typography>
      ),
    },
    { field: 'doctor_name', headerName: 'Doctor', flex: 1, minWidth: 150 },
    { field: 'doctor_reg_no', headerName: 'Reg. No.', width: 130 },
    {
      field: 'file_url', headerName: 'File', width: 90,
      renderCell: (p: GridRenderCellParams<Prescription>) =>
        p.value ? (
          <Tooltip title={p.value}>
            <Link href={p.value} target="_blank" rel="noopener noreferrer">
              <Description fontSize="small" color="primary" />
            </Link>
          </Tooltip>
        ) : <Typography variant="caption" color="text.disabled">—</Typography>,
    },
    {
      field: 'notes', headerName: 'Notes', flex: 1, minWidth: 180,
      renderCell: (p: GridRenderCellParams<Prescription>) =>
        p.value
          ? <Typography variant="body2" noWrap>{p.value}</Typography>
          : <Typography variant="caption" color="text.disabled">—</Typography>,
    },
    { field: 'uploaded_by_name', headerName: 'Uploaded By', width: 140 },
    {
      field: 'created_at', headerName: 'Date', width: 120,
      valueFormatter: (value: any) => value ? new Date(value).toLocaleDateString() : '—',
    },
    {
      field: 'actions', headerName: '', width: 90, sortable: false,
      renderCell: (p: GridRenderCellParams<Prescription>) => canWrite ? (
        <Stack direction="row">
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => { setEditRx(p.row); setFormOpen(true); }}>
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" color="error" onClick={() => handleDelete(p.row)}>
              <Delete fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      ) : null,
    },
  ];

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Prescriptions</Typography>
          <Typography variant="body2" color="text.secondary">
            {total} prescription{total !== 1 ? 's' : ''} recorded
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Tooltip title="Refresh">
            <IconButton onClick={() => refetch()}><Refresh /></IconButton>
          </Tooltip>
          {canWrite && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => { setEditRx(null); setFormOpen(true); }}
            >
              Add Prescription
            </Button>
          )}
        </Stack>
      </Stack>

      {/* Search */}
      <Stack direction="row" spacing={2} mb={2} flexWrap="wrap">
        <TextField
          size="small"
          placeholder="Search by customer, doctor…"
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { setSearch(searchInput); setPage(1); } }}
          sx={{ minWidth: 280 }}
        />
        <Button variant="outlined" size="small" onClick={() => { setSearch(searchInput); setPage(1); }}>
          Search
        </Button>
        {search && (
          <Chip label={`"${search}"`} onDelete={() => { setSearch(''); setSearchInput(''); setPage(1); }} />
        )}
      </Stack>

      {/* Grid */}
      <Box sx={{ height: 600 }}>
        <DataGrid
          rows={prescriptions}
          columns={columns}
          loading={isLoading}
          rowCount={total}
          paginationMode="server"
          paginationModel={{ page: page - 1, pageSize: 20 }}
          onPaginationModelChange={(m) => setPage(m.page + 1)}
          pageSizeOptions={[20]}
          disableRowSelectionOnClick
          density="compact"
          sx={{ border: 'none', '& .MuiDataGrid-columnHeaders': { background: 'transparent' } }}
        />
      </Box>

      <PrescriptionFormDialog
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditRx(null); }}
        prescription={editRx}
      />
    </Box>
  );
};

export default PrescriptionsPage;
