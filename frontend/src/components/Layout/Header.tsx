import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  Tooltip,
  Divider,
  Switch,
  FormControlLabel,
  Badge,
  Chip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  AccountCircle,
  Logout,
  NotificationsOutlined,
  Brightness4,
  Brightness7,
  KeyboardArrowDown,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useLogout } from '../../hooks/useAuth';
import { SIDEBAR_WIDTH } from './Sidebar';

interface HeaderProps {
  onMenuToggle: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

const ROLE_COLORS: Record<string, string> = {
  ADMIN: '#ef5350',
  PHARMACIST: '#42a5f5',
  CASHIER: '#66bb6a',
  INVENTORY_MANAGER: '#ffa726',
};

const Header: React.FC<HeaderProps> = ({ onMenuToggle, darkMode, onToggleDarkMode }) => {
  const { user } = useAuthStore();
  const logoutMutation = useLogout();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleLogout = () => {
    handleClose();
    logoutMutation.mutate();
  };

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        width: { md: `calc(100% - ${SIDEBAR_WIDTH}px)` },
        ml: { md: `${SIDEBAR_WIDTH}px` },
        background: (theme) =>
          theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fff',
        color: 'text.primary',
        borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
      }}
    >
      <Toolbar sx={{ px: { xs: 2, sm: 3 }, gap: 1 }}>
        {/* Mobile hamburger */}
        <IconButton
          edge="start"
          onClick={onMenuToggle}
          sx={{ display: { md: 'none' }, mr: 1 }}
        >
          <MenuIcon />
        </IconButton>

        {/* Page title area */}
        <Box flex={1} />

        {/* Notifications */}
        <Tooltip title="Notifications">
          <IconButton>
            <Badge badgeContent={3} color="error">
              <NotificationsOutlined />
            </Badge>
          </IconButton>
        </Tooltip>

        {/* Dark mode toggle */}
        <Tooltip title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
          <IconButton onClick={onToggleDarkMode}>
            {darkMode ? <Brightness7 /> : <Brightness4 />}
          </IconButton>
        </Tooltip>

        {/* User avatar + menu */}
        <Box
          onClick={handleOpen}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            cursor: 'pointer',
            borderRadius: 2,
            px: 1,
            py: 0.5,
            '&:hover': { background: 'action.hover' },
          }}
        >
          <Avatar
            sx={{
              width: 36,
              height: 36,
              background: ROLE_COLORS[user?.role ?? 'PHARMACIST'],
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </Avatar>
          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
            <Typography variant="body2" fontWeight={600} lineHeight={1.2}>
              {user?.full_name}
            </Typography>
            <Chip
              label={user?.role?.replace('_', ' ')}
              size="small"
              sx={{
                height: 16,
                fontSize: '0.65rem',
                fontWeight: 700,
                background: ROLE_COLORS[user?.role ?? 'PHARMACIST'],
                color: '#fff',
              }}
            />
          </Box>
          <KeyboardArrowDown fontSize="small" sx={{ opacity: 0.6 }} />
        </Box>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          PaperProps={{ sx: { mt: 1, minWidth: 200, borderRadius: 2 } }}
        >
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="body2" fontWeight={600}>{user?.full_name}</Typography>
            <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
          </Box>
          <Divider />
          <MenuItem onClick={() => { handleClose(); navigate('/settings'); }}>
            <ListItemIcon><AccountCircle fontSize="small" /></ListItemIcon>
            My Profile
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
            <ListItemIcon><Logout fontSize="small" color="error" /></ListItemIcon>
            Sign Out
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
