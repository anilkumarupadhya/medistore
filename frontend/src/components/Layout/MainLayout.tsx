import React, { useState } from 'react';
import { Box, Toolbar } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Sidebar, { SIDEBAR_WIDTH } from './Sidebar';
import Header from './Header';

interface MainLayoutProps {
  onToggleDarkMode: () => void;
  darkMode: boolean;
}

/**
 * Root layout with persistent sidebar (desktop) + collapsible drawer (mobile)
 * and a top app bar.
 *
 * Children are rendered via <Outlet /> from React Router v6.
 */
const MainLayout: React.FC<MainLayoutProps> = ({ onToggleDarkMode, darkMode }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Main content area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${SIDEBAR_WIDTH}px)` },
          ml: { md: `${SIDEBAR_WIDTH}px` },
          background: 'background.default',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Top header */}
        <Header
          onMenuToggle={() => setMobileOpen(true)}
          darkMode={darkMode}
          onToggleDarkMode={onToggleDarkMode}
        />

        {/* MUI toolbar spacer */}
        <Toolbar />

        {/* Page content */}
        <Box sx={{ flex: 1, p: { xs: 2, sm: 3 } }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default MainLayout;
