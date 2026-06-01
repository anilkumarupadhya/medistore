import React, { useState, useMemo } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { SnackbarProvider } from 'notistack';
import AppRouter from './routes/AppRouter';
import { lightTheme, darkTheme } from './theme/theme';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,   // 5 min
      refetchOnWindowFocus: false,
    },
  },
});

const App: React.FC = () => {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('msm-dark-mode') === 'true';
  });

  const theme = useMemo(() => (darkMode ? darkTheme : lightTheme), [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      localStorage.setItem('msm-dark-mode', String(!prev));
      return !prev;
    });
  };

  // Inject toggle into Router via context — simplest approach is to pass as prop.
  // AppRouter renders MainLayout which accepts the props.
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SnackbarProvider
          maxSnack={4}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          autoHideDuration={4000}
        >
          <AppRouterWithTheme darkMode={darkMode} onToggleDarkMode={toggleDarkMode} />
        </SnackbarProvider>
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
};

// Wrapper to pass theme props into router
import MainLayout from './components/Layout/MainLayout';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { Box, CircularProgress } from '@mui/material';
import PrivateRoute from './routes/PrivateRoute';

const LoginPage        = lazy(() => import('./pages/Login/LoginPage'));
const DashboardPage    = lazy(() => import('./pages/Dashboard/DashboardPage'));
const UnauthorizedPage = lazy(() => import('./pages/Unauthorized/UnauthorizedPage'));
const MedicinesPage    = lazy(() => import('./pages/Medicines/MedicinesPage'));
const InventoryPage    = lazy(() => import('./pages/Inventory/InventoryPage'));
const SuppliersPage    = lazy(() => import('./pages/Suppliers/SuppliersPage'));
const PurchasesPage    = lazy(() => import('./pages/Purchases/PurchasesPage'));

const PageLoader = () => (
  <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
    <CircularProgress />
  </Box>
);

function ComingSoon({ label }: { label: string }) {
  return (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="60vh" gap={2}>
      <Box sx={{ width: 90, height: 90, borderRadius: '50%', background: 'linear-gradient(135deg,#1976d2,#00897b)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 32, fontWeight: 800 }}>
        {label[0]}
      </Box>
      <Box sx={{ typography: 'h5', fontWeight: 700 }}>{label}</Box>
      <Box sx={{ typography: 'body1', color: 'text.secondary' }}>This module is coming soon.</Box>
    </Box>
  );
}

interface AppRouterWithThemeProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

function AppRouterWithTheme({ darkMode, onToggleDarkMode }: AppRouterWithThemeProps) {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <MainLayout darkMode={darkMode} onToggleDarkMode={onToggleDarkMode} />
              </PrivateRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard"     element={<DashboardPage />} />
            <Route path="medicines"     element={<MedicinesPage />} />
            <Route path="inventory"     element={<InventoryPage />} />
            <Route path="purchases"     element={<PurchasesPage />} />
            <Route path="suppliers"     element={<SuppliersPage />} />
            <Route path="sales"         element={<ComingSoon label="Billing & Sales (POS)" />} />
            <Route path="customers"     element={<ComingSoon label="Customer Management" />} />
            <Route path="prescriptions" element={<ComingSoon label="Prescription Management" />} />
            <Route path="reports"       element={<ComingSoon label="Reports" />} />
            <Route path="users"         element={<PrivateRoute allowedRoles={['ADMIN']}><ComingSoon label="User Management" /></PrivateRoute>} />
            <Route path="settings"      element={<ComingSoon label="Settings" />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
