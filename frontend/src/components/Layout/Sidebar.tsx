import React from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Chip,
  Tooltip,
  alpha,
} from '@mui/material';
import {
  Dashboard,
  MedicalServices,
  Inventory2,
  ShoppingCart,
  LocalShipping,
  PointOfSale,
  PeopleAlt,
  Description,
  BarChart,
  NotificationsActive,
  Settings,
  ManageAccounts,
  LocalPharmacy,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import type { UserRole } from '../../types/auth';

export const SIDEBAR_WIDTH = 260;

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  allowedRoles?: UserRole[];
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',          path: '/dashboard',      icon: <Dashboard /> },
  { label: 'Medicines',          path: '/medicines',      icon: <MedicalServices /> },
  { label: 'Inventory',          path: '/inventory',      icon: <Inventory2 /> },
  { label: 'Purchases',          path: '/purchases',      icon: <ShoppingCart /> },
  { label: 'Suppliers',          path: '/suppliers',      icon: <LocalShipping /> },
  { label: 'Billing & Sales',    path: '/sales',          icon: <PointOfSale /> },
  { label: 'Customers',          path: '/customers',      icon: <PeopleAlt /> },
  { label: 'Prescriptions',      path: '/prescriptions',  icon: <Description /> },
  { label: 'Reports',            path: '/reports',        icon: <BarChart /> },
  { label: 'Notifications',      path: '/notifications',  icon: <NotificationsActive />, badge: 'New' },
];

const BOTTOM_NAV_ITEMS: NavItem[] = [
  { label: 'User Management', path: '/users',    icon: <ManageAccounts />, allowedRoles: ['ADMIN'] },
  { label: 'Settings',        path: '/settings', icon: <Settings /> },
];

const ROLE_COLORS: Record<UserRole, string> = {
  ADMIN: '#ef5350',
  PHARMACIST: '#42a5f5',
  CASHIER: '#66bb6a',
  INVENTORY_MANAGER: '#ffa726',
};

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

const SidebarContent: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  const renderNavItem = (item: NavItem) => {
    if (item.allowedRoles && user && !item.allowedRoles.includes(user.role)) return null;

    const active = isActive(item.path);
    return (
      <ListItem key={item.path} disablePadding sx={{ mb: 0.25 }}>
        <Tooltip title={item.label} placement="right" disableHoverListener>
          <ListItemButton
            onClick={() => navigate(item.path)}
            sx={{
              borderRadius: 2,
              mx: 1,
              color: active ? '#fff' : alpha('#fff', 0.65),
              background: active
                ? 'linear-gradient(90deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.08) 100%)'
                : 'transparent',
              borderLeft: active ? '3px solid #69f0ae' : '3px solid transparent',
              '&:hover': {
                background: alpha('#fff', 0.1),
                color: '#fff',
              },
              transition: 'all 0.2s ease',
            }}
          >
            <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.label}
              primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: active ? 600 : 400 }}
            />
            {item.badge && (
              <Chip
                label={item.badge}
                size="small"
                sx={{ height: 18, fontSize: '0.65rem', background: '#69f0ae', color: '#000', fontWeight: 700 }}
              />
            )}
          </ListItemButton>
        </Tooltip>
      </ListItem>
    );
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Brand */}
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <LocalPharmacy sx={{ color: '#69f0ae', fontSize: 32 }} />
        <Box>
          <Typography variant="h6" fontWeight={800} color="#fff" lineHeight={1.1}>
            MediStore
          </Typography>
          <Typography variant="caption" sx={{ color: alpha('#fff', 0.6), letterSpacing: 1.5 }}>
            PRO
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: alpha('#fff', 0.1), mx: 2, mb: 1 }} />

      {/* User info */}
      {user && (
        <Box sx={{ px: 2, py: 1.5 }}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              background: alpha('#fff', 0.06),
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
            }}
          >
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: ROLE_COLORS[user.role] ?? '#1976d2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: 14,
                color: '#fff',
                flexShrink: 0,
              }}
            >
              {user.first_name[0]}{user.last_name[0]}
            </Box>
            <Box overflow="hidden">
              <Typography variant="body2" color="#fff" fontWeight={600} noWrap>
                {user.full_name}
              </Typography>
              <Typography variant="caption" sx={{ color: ROLE_COLORS[user.role], fontWeight: 600 }}>
                {user.role.replace('_', ' ')}
              </Typography>
            </Box>
          </Box>
        </Box>
      )}

      <Divider sx={{ borderColor: alpha('#fff', 0.08), mx: 2, my: 1 }} />

      {/* Main nav */}
      <Box sx={{ flex: 1, overflowY: 'auto', pb: 1 }}>
        <List disablePadding>
          {NAV_ITEMS.map(renderNavItem)}
        </List>
      </Box>

      {/* Bottom nav */}
      <Divider sx={{ borderColor: alpha('#fff', 0.08), mx: 2 }} />
      <List disablePadding sx={{ py: 1 }}>
        {BOTTOM_NAV_ITEMS.map(renderNavItem)}
      </List>

      <Box sx={{ px: 2, pb: 2 }}>
        <Typography variant="caption" sx={{ color: alpha('#fff', 0.3) }}>
          v1.0.0 — Phase 1
        </Typography>
      </Box>
    </Box>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onMobileClose }) => (
  <>
    {/* Mobile drawer */}
    <Drawer
      variant="temporary"
      open={mobileOpen}
      onClose={onMobileClose}
      ModalProps={{ keepMounted: true }}
      sx={{
        display: { xs: 'block', md: 'none' },
        '& .MuiDrawer-paper': { width: SIDEBAR_WIDTH },
      }}
    >
      <SidebarContent />
    </Drawer>

    {/* Desktop permanent drawer */}
    <Drawer
      variant="permanent"
      sx={{
        display: { xs: 'none', md: 'block' },
        '& .MuiDrawer-paper': { width: SIDEBAR_WIDTH, boxSizing: 'border-box', border: 'none' },
      }}
      open
    >
      <SidebarContent />
    </Drawer>
  </>
);

export default Sidebar;
