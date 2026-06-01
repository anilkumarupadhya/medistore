import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  LinearProgress,
  alpha,
  useTheme,
} from '@mui/material';
import {
  TrendingUp,
  Inventory2,
  LocalShipping,
  Warning,
  CheckCircle,
  ErrorOutline,
  ShoppingCart,
  PeopleAlt,
  ReceiptLong,
} from '@mui/icons-material';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { useAuthStore } from '../../store/authStore';

// ─── Mock data (will be replaced by React Query calls in Phase 2) ─────────────
const SALES_DATA = [
  { day: 'Mon', sales: 42000, purchases: 18000 },
  { day: 'Tue', sales: 53000, purchases: 22000 },
  { day: 'Wed', sales: 48000, purchases: 20000 },
  { day: 'Thu', sales: 61000, purchases: 31000 },
  { day: 'Fri', sales: 55000, purchases: 25000 },
  { day: 'Sat', sales: 72000, purchases: 28000 },
  { day: 'Sun', sales: 38000, purchases: 15000 },
];

const LOW_STOCK = [
  { name: 'Atorvastatin 10mg', stock: 8,  reorder: 20 },
  { name: 'Losartan 50mg',     stock: 5,  reorder: 25 },
  { name: 'Metformin 500mg',   stock: 12, reorder: 30 },
];

const EXPIRING = [
  { name: 'Insulin Glargine 100U/mL', days: 8,  batch: 'B-2401' },
  { name: 'Betamethasone Cream',      days: 15, batch: 'B-2402' },
  { name: 'Pantoprazole 40mg',        days: 15, batch: 'C-2399' },
];

// ─── Stat card ────────────────────────────────────────────────────────────────
interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  trend?: string;
  trendUp?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon, color, trend, trendUp }) => {
  const theme = useTheme();
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="body2" color="text.secondary" fontWeight={500} gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" fontWeight={800} color="text.primary">
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              {subtitle}
            </Typography>
            {trend && (
              <Chip
                label={trend}
                size="small"
                icon={<TrendingUp fontSize="small" />}
                sx={{
                  mt: 1,
                  height: 22,
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  background: alpha(trendUp ? '#2e7d32' : '#d32f2f', 0.12),
                  color: trendUp ? '#2e7d32' : '#d32f2f',
                }}
              />
            )}
          </Box>
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: 2.5,
              background: alpha(color, 0.12),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: color,
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────
const DashboardPage: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuthStore();

  return (
    <Box>
      {/* Page heading */}
      <Box mb={3}>
        <Typography variant="h5" fontWeight={800}>
          Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Welcome back, {user?.first_name}. Here's what's happening today.
        </Typography>
      </Box>

      {/* ── KPI stat cards ─────────────────────────────────────────────── */}
      <Grid container spacing={2.5} mb={3}>
        {[
          {
            title: "Today's Sales",
            value: '₹72,450',
            subtitle: '148 invoices',
            icon: <ReceiptLong />,
            color: '#1976d2',
            trend: '+12% vs yesterday',
            trendUp: true,
          },
          {
            title: 'Monthly Revenue',
            value: '₹18.4L',
            subtitle: 'June 2026',
            icon: <TrendingUp />,
            color: '#00897b',
            trend: '+8% vs last month',
            trendUp: true,
          },
          {
            title: 'Total Medicines',
            value: '1,247',
            subtitle: '13 low stock',
            icon: <Inventory2 />,
            color: '#f57c00',
          },
          {
            title: 'Total Suppliers',
            value: '38',
            subtitle: '5 pending payments',
            icon: <LocalShipping />,
            color: '#7b1fa2',
          },
          {
            title: 'Total Customers',
            value: '2,891',
            subtitle: '24 new this month',
            icon: <PeopleAlt />,
            color: '#0288d1',
          },
          {
            title: 'Pending Payments',
            value: '₹2.1L',
            subtitle: '12 overdue',
            icon: <ShoppingCart />,
            color: '#d32f2f',
          },
        ].map((stat) => (
          <Grid item xs={12} sm={6} lg={4} key={stat.title}>
            <StatCard {...stat} />
          </Grid>
        ))}
      </Grid>

      {/* ── Sales chart + alerts ───────────────────────────────────────── */}
      <Grid container spacing={2.5} mb={3}>
        {/* Weekly sales chart */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} mb={2.5}>
                Weekly Sales vs Purchases
              </Typography>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={SALES_DATA} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#1976d2" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#1976d2" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorPurchases" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#00897b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00897b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <ReTooltip formatter={(v: number) => `₹${v.toLocaleString()}`} />
                  <Legend />
                  <Area type="monotone" dataKey="sales"     name="Sales"     stroke="#1976d2" fill="url(#colorSales)"     strokeWidth={2} dot={{ r: 3 }} />
                  <Area type="monotone" dataKey="purchases" name="Purchases" stroke="#00897b" fill="url(#colorPurchases)" strokeWidth={2} dot={{ r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Alert panel */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} mb={2}>
                Alerts
              </Typography>

              {/* Low stock */}
              <Box mb={2}>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <Warning fontSize="small" color="warning" />
                  <Typography variant="body2" fontWeight={600} color="warning.main">
                    Low Stock ({LOW_STOCK.length})
                  </Typography>
                </Box>
                {LOW_STOCK.map((item) => (
                  <Box key={item.name} mb={1.5}>
                    <Box display="flex" justifyContent="space-between" mb={0.5}>
                      <Typography variant="caption" fontWeight={500} noWrap sx={{ maxWidth: 160 }}>
                        {item.name}
                      </Typography>
                      <Typography variant="caption" color="error.main" fontWeight={700}>
                        {item.stock}/{item.reorder}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={(item.stock / item.reorder) * 100}
                      sx={{
                        height: 5,
                        borderRadius: 3,
                        background: alpha('#f57c00', 0.2),
                        '& .MuiLinearProgress-bar': { background: '#f57c00' },
                      }}
                    />
                  </Box>
                ))}
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Expiring soon */}
              <Box>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <ErrorOutline fontSize="small" color="error" />
                  <Typography variant="body2" fontWeight={600} color="error.main">
                    Expiring Soon ({EXPIRING.length})
                  </Typography>
                </Box>
                <List disablePadding dense>
                  {EXPIRING.map((item) => (
                    <ListItem key={item.name} disablePadding sx={{ mb: 0.75 }}>
                      <ListItemAvatar sx={{ minWidth: 36 }}>
                        <Avatar
                          sx={{
                            width: 28,
                            height: 28,
                            fontSize: 10,
                            fontWeight: 700,
                            background: item.days <= 10 ? alpha('#d32f2f', 0.12) : alpha('#f57c00', 0.12),
                            color: item.days <= 10 ? 'error.main' : 'warning.main',
                          }}
                        >
                          {item.days}d
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={item.name}
                        secondary={`Batch: ${item.batch}`}
                        primaryTypographyProps={{ fontSize: 12, fontWeight: 500, noWrap: true }}
                        secondaryTypographyProps={{ fontSize: 11 }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ── Top selling medicines bar chart ────────────────────────────── */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} mb={2.5}>
                Top Selling Medicines (This Month)
              </Typography>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={[
                    { name: 'Paracetamol', qty: 1240 },
                    { name: 'Cetirizine',  qty: 870 },
                    { name: 'Ibuprofen',   qty: 720 },
                    { name: 'Omeprazole',  qty: 610 },
                    { name: 'Amoxicillin', qty: 490 },
                  ]}
                  layout="vertical"
                  margin={{ left: 16 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 11 }} />
                  <ReTooltip />
                  <Bar dataKey="qty" name="Units Sold" fill="#1976d2" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} mb={2}>
                Quick Stats
              </Typography>
              {[
                { label: "Today's Profit",          value: '₹18,420', icon: <CheckCircle color="success" />, color: 'success.main' },
                { label: 'GST Collected (June)',    value: '₹1,24,800', icon: <ReceiptLong color="primary" />, color: 'primary.main' },
                { label: 'Purchase Orders (June)',  value: '42 orders', icon: <ShoppingCart color="secondary" />, color: 'secondary.main' },
                { label: 'New Customers (June)',    value: '24',          icon: <PeopleAlt color="info" />, color: 'info.main' },
                { label: 'Medicines Expiring <30d', value: '13 items',    icon: <Warning color="warning" />, color: 'warning.main' },
                { label: 'Pending Supplier Bills',  value: '₹2,10,000',  icon: <ErrorOutline color="error" />, color: 'error.main' },
              ].map(({ label, value, icon, color }) => (
                <Box
                  key={label}
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  py={1}
                  sx={{ borderBottom: '1px solid', borderColor: 'divider', '&:last-child': { border: 'none' } }}
                >
                  <Box display="flex" alignItems="center" gap={1.5}>
                    {icon}
                    <Typography variant="body2">{label}</Typography>
                  </Box>
                  <Typography variant="body2" fontWeight={700} color={color}>
                    {value}
                  </Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;
