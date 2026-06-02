import React from 'react';
import {
  Box, Typography, Stack, Card, CardContent, Grid,
  Table, TableHead, TableRow, TableCell, TableBody,
  Chip, CircularProgress, Alert, Button,
} from '@mui/material';
import { Refresh, WarningAmber, ErrorOutline, Inventory2Outlined } from '@mui/icons-material';
import { useNotifications } from '../../hooks/useNotifications';
import type { LowStockAlert, OutOfStockAlert, ExpiringAlert } from '../../types/notification';

function SectionHeader({ icon, title, count, color }: {
  icon: React.ReactNode;
  title: string;
  count: number;
  color: 'warning' | 'error' | 'info';
}) {
  return (
    <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
      <Box color={`${color}.main`}>{icon}</Box>
      <Typography variant="subtitle1" fontWeight={700}>{title}</Typography>
      <Chip label={count} size="small" color={count > 0 ? color : 'default'} />
    </Stack>
  );
}

const NotificationsPage: React.FC = () => {
  const { data, isLoading, refetch, isFetching } = useNotifications();

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  const totalCount      = data?.total_count ?? 0;
  const lowStock: LowStockAlert[]    = data?.low_stock      ?? [];
  const outOfStock: OutOfStockAlert[] = data?.out_of_stock  ?? [];
  const expiringSoon: ExpiringAlert[] = data?.expiring_soon ?? [];
  const expired: ExpiringAlert[]      = data?.expired       ?? [];

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Alerts & Notifications</Typography>
          <Typography variant="body2" color="text.secondary">
            {totalCount === 0
              ? 'Everything looks good — no active alerts.'
              : `${totalCount} active alert${totalCount !== 1 ? 's' : ''} require your attention.`}
          </Typography>
        </Box>
        <Button startIcon={<Refresh />} onClick={() => refetch()} disabled={isFetching} size="small">
          Refresh
        </Button>
      </Stack>

      {totalCount === 0 && (
        <Alert severity="success" sx={{ borderRadius: 2 }}>
          No stock or expiry alerts at this time.
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Out of Stock */}
        {outOfStock.length > 0 && (
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ borderRadius: 2 }}>
              <CardContent>
                <SectionHeader
                  icon={<ErrorOutline />}
                  title="Out of Stock"
                  count={outOfStock.length}
                  color="error"
                />
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Medicine</TableCell>
                      <TableCell>Unit</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {outOfStock.map(r => (
                      <TableRow key={r.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>{r.name}</Typography>
                        </TableCell>
                        <TableCell>{r.unit}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Low Stock */}
        {lowStock.length > 0 && (
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ borderRadius: 2 }}>
              <CardContent>
                <SectionHeader
                  icon={<WarningAmber />}
                  title="Low Stock"
                  count={lowStock.length}
                  color="warning"
                />
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Medicine</TableCell>
                      <TableCell align="right">Stock</TableCell>
                      <TableCell align="right">Reorder Level</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {lowStock.map(r => (
                      <TableRow key={r.id} hover>
                        <TableCell>{r.name}</TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={700} color="warning.main">
                            {r.stock_quantity} {r.unit}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">{r.reorder_level}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Expired with stock */}
        {expired.length > 0 && (
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ borderRadius: 2, borderColor: 'error.main' }}>
              <CardContent>
                <SectionHeader
                  icon={<ErrorOutline />}
                  title="Expired (with stock)"
                  count={expired.length}
                  color="error"
                />
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Medicine</TableCell>
                      <TableCell>Expired On</TableCell>
                      <TableCell align="right">Stock</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {expired.map(r => (
                      <TableRow key={r.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>{r.name}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={r.expiry_date} size="small" color="error" />
                        </TableCell>
                        <TableCell align="right">{r.stock_quantity} {r.unit}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Expiring soon */}
        {expiringSoon.length > 0 && (
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ borderRadius: 2, borderColor: 'warning.main' }}>
              <CardContent>
                <SectionHeader
                  icon={<WarningAmber />}
                  title="Expiring Within 30 Days"
                  count={expiringSoon.length}
                  color="warning"
                />
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Medicine</TableCell>
                      <TableCell>Expiry Date</TableCell>
                      <TableCell align="right">Stock</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {expiringSoon.map(r => (
                      <TableRow key={r.id} hover>
                        <TableCell>{r.name}</TableCell>
                        <TableCell>
                          <Chip label={r.expiry_date} size="small" color="warning" />
                        </TableCell>
                        <TableCell align="right">{r.stock_quantity} {r.unit}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default NotificationsPage;
