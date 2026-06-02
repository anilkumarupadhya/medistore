import React, { useState } from 'react';
import {
  Box, Button, Typography, Stack, TextField, MenuItem,
  IconButton, Tooltip, Chip, Tabs, Tab, Table, TableHead,
  TableRow, TableCell, TableBody, Card, CardContent, alpha,
} from '@mui/material';
import { Add, Refresh, Edit, PersonOff, PersonAdd, Check, Close } from '@mui/icons-material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { useUserList, useDeactivateUser, useUpdateUser, useAuditLogs } from '../../hooks/useUsers';
import type { User } from '../../types/auth';
import UserFormDialog from './components/UserFormDialog';

const ROLE_COLORS: Record<string, 'error' | 'info' | 'success' | 'warning'> = {
  ADMIN:             'error',
  PHARMACIST:        'info',
  CASHIER:           'success',
  INVENTORY_MANAGER: 'warning',
};

const ACTION_COLORS: Record<string, 'error' | 'info' | 'success' | 'warning' | 'default'> = {
  LOGIN:           'success',
  LOGOUT:          'default',
  LOGIN_FAILED:    'error',
  PASSWORD_CHANGE: 'warning',
  CREATE:          'info',
  UPDATE:          'info',
  DELETE:          'error',
};

export default function UsersPage() {
  const [tab, setTab] = useState(0);

  // Users tab state
  const [search, setSearch]         = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState<'' | 'true' | 'false'>('');
  const [page, setPage]             = useState(1);
  const [formOpen, setFormOpen]     = useState(false);
  const [editUser, setEditUser]     = useState<User | null>(null);

  // Audit log state
  const [logPage, setLogPage]       = useState(1);
  const [logSearch, setLogSearch]   = useState('');
  const [logSearchInput, setLogSearchInput] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const { data, isLoading, refetch } = useUserList({
    search:    search || undefined,
    role:      roleFilter || undefined,
    is_active: activeFilter === '' ? undefined : activeFilter === 'true',
    page,
    page_size: 20,
  });

  const { data: logsData, isLoading: logsLoading, refetch: refetchLogs } = useAuditLogs({
    search: logSearch || undefined,
    action: actionFilter || undefined,
    page:   logPage,
    page_size: 25,
  });

  const deactivateMutation = useDeactivateUser();
  const updateMutation     = useUpdateUser();

  const users: User[]  = data?.results ?? [];
  const total          = data?.count ?? 0;
  const logs           = logsData?.results ?? [];
  const logsTotal      = logsData?.count ?? 0;

  const handleToggleActive = (u: User) => {
    if (!u.is_active) {
      updateMutation.mutate({ id: u.id, data: { is_active: true } });
    } else {
      if (!window.confirm(`Deactivate ${u.full_name}?`)) return;
      deactivateMutation.mutate(u.id);
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'full_name', headerName: 'Name', flex: 1, minWidth: 160,
      renderCell: (p: GridRenderCellParams<User>) => (
        <Stack>
          <Typography variant="body2" fontWeight={600}>{p.row.full_name}</Typography>
          <Typography variant="caption" color="text.secondary">{p.row.email}</Typography>
        </Stack>
      ),
    },
    {
      field: 'role', headerName: 'Role', width: 160,
      renderCell: (p: GridRenderCellParams<User>) => (
        <Chip label={p.value?.replace('_', ' ')} size="small"
          color={ROLE_COLORS[p.value] ?? 'default'} />
      ),
    },
    { field: 'phone', headerName: 'Phone', width: 140,
      valueFormatter: (v: any) => v || '—' },
    {
      field: 'is_active', headerName: 'Status', width: 110,
      renderCell: (p: GridRenderCellParams<User>) => (
        <Chip
          label={p.value ? 'Active' : 'Inactive'}
          size="small"
          color={p.value ? 'success' : 'default'}
        />
      ),
    },
    {
      field: 'last_login', headerName: 'Last Login', width: 130,
      valueFormatter: (v: any) => v ? new Date(v).toLocaleDateString() : 'Never',
    },
    {
      field: 'created_at', headerName: 'Joined', width: 110,
      valueFormatter: (v: any) => v ? new Date(v).toLocaleDateString() : '—',
    },
    {
      field: 'actions', headerName: '', width: 100, sortable: false,
      renderCell: (p: GridRenderCellParams<User>) => (
        <Stack direction="row">
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => { setEditUser(p.row); setFormOpen(true); }}>
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={p.row.is_active ? 'Deactivate' : 'Reactivate'}>
            <IconButton
              size="small"
              color={p.row.is_active ? 'error' : 'success'}
              onClick={() => handleToggleActive(p.row)}
            >
              {p.row.is_active ? <PersonOff fontSize="small" /> : <PersonAdd fontSize="small" />}
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Typography variant="h5" fontWeight={700} mb={1}>User Management</Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Manage staff accounts and review system audit logs.
      </Typography>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Tab label={`Users (${total})`} />
        <Tab label={`Audit Logs (${logsTotal})`} />
      </Tabs>

      {/* ── Users Tab ── */}
      {tab === 0 && (
        <>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2} flexWrap="wrap" gap={2}>
            <Stack direction="row" spacing={1.5} flexWrap="wrap" gap={1}>
              <TextField
                size="small" placeholder="Search name / email…"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { setSearch(searchInput); setPage(1); } }}
                sx={{ width: 240 }}
              />
              <TextField select size="small" label="Role" value={roleFilter}
                onChange={e => { setRoleFilter(e.target.value); setPage(1); }} sx={{ width: 180 }}>
                <MenuItem value="">All Roles</MenuItem>
                <MenuItem value="ADMIN">Admin</MenuItem>
                <MenuItem value="PHARMACIST">Pharmacist</MenuItem>
                <MenuItem value="CASHIER">Cashier</MenuItem>
                <MenuItem value="INVENTORY_MANAGER">Inventory Manager</MenuItem>
              </TextField>
              <TextField select size="small" label="Status" value={activeFilter}
                onChange={e => { setActiveFilter(e.target.value as any); setPage(1); }} sx={{ width: 130 }}>
                <MenuItem value="">All</MenuItem>
                <MenuItem value="true">Active</MenuItem>
                <MenuItem value="false">Inactive</MenuItem>
              </TextField>
              <Button size="small" variant="outlined"
                onClick={() => { setSearch(searchInput); setPage(1); }}>Search</Button>
            </Stack>
            <Stack direction="row" spacing={1}>
              <Tooltip title="Refresh"><IconButton onClick={() => refetch()}><Refresh /></IconButton></Tooltip>
              <Button variant="contained" startIcon={<Add />}
                onClick={() => { setEditUser(null); setFormOpen(true); }}>
                Add User
              </Button>
            </Stack>
          </Stack>

          <Box sx={{ height: 560 }}>
            <DataGrid
              rows={users}
              columns={columns}
              loading={isLoading}
              rowCount={total}
              paginationMode="server"
              paginationModel={{ page: page - 1, pageSize: 20 }}
              onPaginationModelChange={m => setPage(m.page + 1)}
              pageSizeOptions={[20]}
              disableRowSelectionOnClick
              rowHeight={56}
              sx={{ border: 'none' }}
            />
          </Box>
        </>
      )}

      {/* ── Audit Logs Tab ── */}
      {tab === 1 && (
        <>
          <Stack direction="row" spacing={1.5} mb={2} flexWrap="wrap" gap={1}>
            <TextField
              size="small" placeholder="Search email / resource…"
              value={logSearchInput}
              onChange={e => setLogSearchInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { setLogSearch(logSearchInput); setLogPage(1); } }}
              sx={{ width: 260 }}
            />
            <TextField select size="small" label="Action" value={actionFilter}
              onChange={e => { setActionFilter(e.target.value); setLogPage(1); }} sx={{ width: 180 }}>
              <MenuItem value="">All Actions</MenuItem>
              {['LOGIN','LOGOUT','LOGIN_FAILED','PASSWORD_CHANGE','CREATE','UPDATE','DELETE'].map(a => (
                <MenuItem key={a} value={a}>{a.replace('_', ' ')}</MenuItem>
              ))}
            </TextField>
            <Button size="small" variant="outlined"
              onClick={() => { setLogSearch(logSearchInput); setLogPage(1); }}>Search</Button>
            <Tooltip title="Refresh"><IconButton onClick={() => refetchLogs()}><Refresh /></IconButton></Tooltip>
          </Stack>

          <Card variant="outlined" sx={{ borderRadius: 2 }}>
            <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ background: t => alpha(t.palette.primary.main, 0.04) }}>
                    <TableCell>User</TableCell>
                    <TableCell>Action</TableCell>
                    <TableCell>Resource</TableCell>
                    <TableCell>IP</TableCell>
                    <TableCell>OK</TableCell>
                    <TableCell>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logs.map(log => (
                    <TableRow key={log.id} hover>
                      <TableCell>
                        <Typography variant="body2">{log.user_email || '—'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={log.action.replace('_', ' ')}
                          size="small"
                          color={ACTION_COLORS[log.action] ?? 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {log.resource}{log.resource_id ? ` #${log.resource_id.slice(0, 8)}` : ''}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">{log.ip_address || '—'}</Typography>
                      </TableCell>
                      <TableCell>
                        {log.success
                          ? <Check fontSize="small" color="success" />
                          : <Close fontSize="small" color="error" />}
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          {new Date(log.created_at).toLocaleString()}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!logsLoading && logs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Typography variant="caption" color="text.disabled" py={2} display="block">
                          No audit logs found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {logsTotal > 25 && (
            <Stack direction="row" justifyContent="center" spacing={1} mt={2}>
              <Button size="small" disabled={logPage <= 1} onClick={() => setLogPage(p => p - 1)}>Prev</Button>
              <Typography variant="body2" alignSelf="center">
                Page {logPage} of {logsData?.total_pages ?? 1}
              </Typography>
              <Button size="small" disabled={logPage >= (logsData?.total_pages ?? 1)} onClick={() => setLogPage(p => p + 1)}>Next</Button>
            </Stack>
          )}
        </>
      )}

      <UserFormDialog
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditUser(null); }}
        user={editUser}
      />
    </Box>
  );
}
