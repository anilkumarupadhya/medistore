import React, { useState } from 'react';
import {
  Box, Tabs, Tab, Typography, Grid, Card, CardContent, Stack,
  TextField, Button, Table, TableHead, TableRow, TableCell,
  TableBody, Chip, CircularProgress, alpha, useTheme,
} from '@mui/material';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { Refresh } from '@mui/icons-material';
import { useSalesReport, useInventoryReport, usePurchaseReport } from '../../hooks/useReports';
import type { ReportFilters } from '../../types/report';

// ─── helpers ────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const PIE_COLORS = ['#1976d2', '#00897b', '#f57c00', '#8e24aa', '#e53935'];

function SummaryCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  const theme = useTheme();
  return (
    <Card variant="outlined" sx={{ borderRadius: 2 }}>
      <CardContent sx={{ pb: '12px !important' }}>
        <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing={0.5}>
          {label}
        </Typography>
        <Typography variant="h5" fontWeight={800} color={color ?? 'text.primary'} mt={0.5}>
          {value}
        </Typography>
        {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
      </CardContent>
    </Card>
  );
}

function DateRangeFilter({ filters, onChange }: {
  filters: ReportFilters;
  onChange: (f: ReportFilters) => void;
}) {
  const [from, setFrom] = useState(filters.date_from ?? '');
  const [to, setTo]     = useState(filters.date_to ?? '');

  const apply = () => onChange({ date_from: from || undefined, date_to: to || undefined });
  const clear = () => { setFrom(''); setTo(''); onChange({}); };

  return (
    <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
      <TextField size="small" type="date" label="From" value={from}
        onChange={e => setFrom(e.target.value)} InputLabelProps={{ shrink: true }} />
      <TextField size="small" type="date" label="To" value={to}
        onChange={e => setTo(e.target.value)} InputLabelProps={{ shrink: true }} />
      <Button variant="contained" size="small" onClick={apply}>Apply</Button>
      {(from || to) && <Button size="small" onClick={clear}>Clear</Button>}
    </Stack>
  );
}

// ─── Sales Tab ───────────────────────────────────────────────────────────────
function SalesTab() {
  const [filters, setFilters] = useState<ReportFilters>({});
  const { data, isLoading, refetch } = useSalesReport(filters);

  if (isLoading) return <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>;
  if (!data) return null;

  const { totals, daily, top_medicines, payment_breakdown } = data;

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" flexWrap="wrap" gap={2}>
        <DateRangeFilter filters={filters} onChange={f => { setFilters(f); }} />
        <Button startIcon={<Refresh />} onClick={() => refetch()} size="small">Refresh</Button>
      </Stack>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          <SummaryCard label="Total Sales" value={totals.total_count} color="primary.main" />
        </Grid>
        <Grid item xs={12} sm={4}>
          <SummaryCard label="Total Revenue" value={fmt(totals.total_revenue)} color="success.main" />
        </Grid>
        <Grid item xs={12} sm={4}>
          <SummaryCard label="Amount Collected" value={fmt(totals.total_paid)}
            sub={`Outstanding: ${fmt(totals.total_revenue - totals.total_paid)}`} />
        </Grid>
      </Grid>

      {/* Daily Revenue Chart */}
      {daily.length > 0 && (
        <Card variant="outlined" sx={{ borderRadius: 2 }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={700} mb={2}>Daily Revenue</Typography>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={daily} margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <RTooltip formatter={(v: any) => fmt(v)} />
                <Bar dataKey="revenue" name="Revenue" fill="#1976d2" radius={[4, 4, 0, 0]} />
                <Bar dataKey="paid" name="Collected" fill="#00897b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Grid container spacing={2}>
        {/* Top Medicines */}
        <Grid item xs={12} md={7}>
          <Card variant="outlined" sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} mb={1}>Top 10 Medicines by Qty</Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Medicine</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell align="right">Qty</TableCell>
                    <TableCell align="right">Revenue</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {top_medicines.map((r, i) => (
                    <TableRow key={r.name} hover>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell>{r.name}</TableCell>
                      <TableCell><Chip label={r.category} size="small" /></TableCell>
                      <TableCell align="right">{r.total_qty}</TableCell>
                      <TableCell align="right">{fmt(r.total_revenue)}</TableCell>
                    </TableRow>
                  ))}
                  {top_medicines.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Typography variant="caption" color="text.disabled">No data</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>

        {/* Payment Breakdown */}
        <Grid item xs={12} md={5}>
          <Card variant="outlined" sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} mb={1}>Payment Methods</Typography>
              {payment_breakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={payment_breakdown} dataKey="total" nameKey="method"
                      cx="50%" cy="50%" outerRadius={80} label={({ method, percent }) =>
                        `${method} ${(percent * 100).toFixed(0)}%`
                      }>
                      {payment_breakdown.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Typography variant="caption" color="text.disabled">No data</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
}

// ─── Inventory Tab ───────────────────────────────────────────────────────────
function InventoryTab() {
  const { data, isLoading, refetch } = useInventoryReport();

  if (isLoading) return <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>;
  if (!data) return null;

  const { summary, category_breakdown, low_stock, expiring, expired } = data;

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="flex-end">
        <Button startIcon={<Refresh />} onClick={() => refetch()} size="small">Refresh</Button>
      </Stack>

      <Grid container spacing={2}>
        {[
          { label: 'Total Medicines',   value: summary.total_medicines },
          { label: 'Stock Value (Cost)', value: fmt(summary.total_stock_value) },
          { label: 'Stock Value (MRP)',  value: fmt(summary.selling_stock_value) },
          { label: 'Potential Profit',   value: fmt(summary.potential_profit), color: 'success.main' },
          { label: 'Low Stock',          value: summary.low_stock_count,        color: summary.low_stock_count > 0 ? 'warning.main' : undefined },
          { label: 'Out of Stock',       value: summary.out_of_stock_count,     color: summary.out_of_stock_count > 0 ? 'error.main' : undefined },
          { label: 'Expiring Soon',      value: summary.expiring_soon_count,    color: summary.expiring_soon_count > 0 ? 'warning.main' : undefined },
          { label: 'Expired w/ Stock',   value: summary.expired_count,          color: summary.expired_count > 0 ? 'error.main' : undefined },
        ].map(c => (
          <Grid item xs={6} sm={3} key={c.label}>
            <SummaryCard {...c} />
          </Grid>
        ))}
      </Grid>

      {/* Category Breakdown */}
      <Card variant="outlined" sx={{ borderRadius: 2 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={700} mb={1}>By Category</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Category</TableCell>
                <TableCell align="right">Products</TableCell>
                <TableCell align="right">Total Stock</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {category_breakdown.map(r => (
                <TableRow key={r.category} hover>
                  <TableCell><Chip label={r.category} size="small" /></TableCell>
                  <TableCell align="right">{r.count}</TableCell>
                  <TableCell align="right">{r.total_stock}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        {/* Low Stock */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined" sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} mb={1} color="warning.main">
                Low Stock ({low_stock.length})
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Medicine</TableCell>
                    <TableCell align="right">Stock</TableCell>
                    <TableCell align="right">Reorder</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {low_stock.map(r => (
                    <TableRow key={r.id} hover>
                      <TableCell>{r.name}</TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" color={r.stock_quantity === 0 ? 'error.main' : 'warning.main'} fontWeight={700}>
                          {r.stock_quantity} {r.unit}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">{r.reorder_level}</TableCell>
                    </TableRow>
                  ))}
                  {low_stock.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} align="center">
                        <Typography variant="caption" color="text.disabled">All stock levels OK</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>

        {/* Expiring / Expired */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined" sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} mb={1} color="error.main">
                Expiring Soon / Expired ({expiring.length + expired.length})
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Medicine</TableCell>
                    <TableCell>Expiry</TableCell>
                    <TableCell align="right">Stock</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {expired.map(r => (
                    <TableRow key={r.id} hover sx={{ background: t => alpha(t.palette.error.main, 0.05) }}>
                      <TableCell>{r.name}</TableCell>
                      <TableCell>{r.expiry_date}</TableCell>
                      <TableCell align="right">{r.stock_quantity} {r.unit}</TableCell>
                      <TableCell><Chip label="EXPIRED" color="error" size="small" /></TableCell>
                    </TableRow>
                  ))}
                  {expiring.map(r => (
                    <TableRow key={r.id} hover sx={{ background: t => alpha(t.palette.warning.main, 0.05) }}>
                      <TableCell>{r.name}</TableCell>
                      <TableCell>{r.expiry_date}</TableCell>
                      <TableCell align="right">{r.stock_quantity} {r.unit}</TableCell>
                      <TableCell><Chip label="EXPIRING" color="warning" size="small" /></TableCell>
                    </TableRow>
                  ))}
                  {expiring.length === 0 && expired.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        <Typography variant="caption" color="text.disabled">No expiry issues</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
}

// ─── Purchases Tab ───────────────────────────────────────────────────────────
function PurchasesTab() {
  const [filters, setFilters] = useState<ReportFilters>({});
  const { data, isLoading, refetch } = usePurchaseReport(filters);

  if (isLoading) return <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>;
  if (!data) return null;

  const { totals, by_supplier, by_status, top_medicines } = data;

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" flexWrap="wrap" gap={2}>
        <DateRangeFilter filters={filters} onChange={setFilters} />
        <Button startIcon={<Refresh />} onClick={() => refetch()} size="small">Refresh</Button>
      </Stack>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={3}>
          <SummaryCard label="Total Orders" value={totals.total_orders} color="primary.main" />
        </Grid>
        <Grid item xs={12} sm={3}>
          <SummaryCard label="Total Value" value={fmt(totals.total_value)} />
        </Grid>
        <Grid item xs={12} sm={3}>
          <SummaryCard label="Amount Paid" value={fmt(totals.total_paid)} color="success.main" />
        </Grid>
        <Grid item xs={12} sm={3}>
          <SummaryCard label="Outstanding" value={fmt(totals.outstanding)}
            color={totals.outstanding > 0 ? 'error.main' : undefined} />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        {/* By Supplier */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined" sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} mb={1}>Top Suppliers</Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Supplier</TableCell>
                    <TableCell align="right">Orders</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell align="right">Paid</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {by_supplier.map(r => (
                    <TableRow key={r.supplier} hover>
                      <TableCell>{r.supplier}</TableCell>
                      <TableCell align="right">{r.orders}</TableCell>
                      <TableCell align="right">{fmt(r.total)}</TableCell>
                      <TableCell align="right">{fmt(r.paid)}</TableCell>
                    </TableRow>
                  ))}
                  {by_supplier.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        <Typography variant="caption" color="text.disabled">No data</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>

        {/* By Status */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined" sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} mb={1}>By Status</Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Orders</TableCell>
                    <TableCell align="right">Total Value</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {by_status.map(r => (
                    <TableRow key={r.status} hover>
                      <TableCell><Chip label={r.status} size="small" /></TableCell>
                      <TableCell align="right">{r.count}</TableCell>
                      <TableCell align="right">{fmt(r.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Top Medicines */}
      <Card variant="outlined" sx={{ borderRadius: 2 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={700} mb={1}>Top 10 Purchased Medicines</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Medicine</TableCell>
                <TableCell align="right">Qty Purchased</TableCell>
                <TableCell align="right">Total Value</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {top_medicines.map((r, i) => (
                <TableRow key={r.name} hover>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>{r.name}</TableCell>
                  <TableCell align="right">{r.total_qty}</TableCell>
                  <TableCell align="right">{fmt(r.total_value)}</TableCell>
                </TableRow>
              ))}
              {top_medicines.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    <Typography variant="caption" color="text.disabled">No data</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Stack>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const ReportsPage: React.FC = () => {
  const [tab, setTab] = useState(0);

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Typography variant="h5" fontWeight={700} mb={1}>Reports</Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Analytics and insights for sales, inventory, and purchases.
      </Typography>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="Sales" />
        <Tab label="Inventory" />
        <Tab label="Purchases" />
      </Tabs>

      {tab === 0 && <SalesTab />}
      {tab === 1 && <InventoryTab />}
      {tab === 2 && <PurchasesTab />}
    </Box>
  );
};

export default ReportsPage;
