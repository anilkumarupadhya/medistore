import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import PrivateRoute from './PrivateRoute';
import MainLayout from '../components/Layout/MainLayout';

// ─── Lazy-loaded pages ────────────────────────────────────────────────────────
const LoginPage      = lazy(() => import('../pages/Login/LoginPage'));
const DashboardPage  = lazy(() => import('../pages/Dashboard/DashboardPage'));
const UnauthorizedPage = lazy(() => import('../pages/Unauthorized/UnauthorizedPage'));

const PageLoader = () => (
  <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
    <CircularProgress />
  </Box>
);

const AppRouter: React.FC = () => (
  <BrowserRouter>
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* Protected routes wrapped in the main sidebar layout */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <MainLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />

          {/* Placeholder routes for Phase 2+ modules */}
          <Route path="medicines"  element={<ComingSoon label="Medicine Management" />} />
          <Route path="inventory"  element={<ComingSoon label="Inventory Management" />} />
          <Route path="purchases"  element={<ComingSoon label="Purchase Management" />} />
          <Route path="suppliers"  element={<ComingSoon label="Supplier Management" />} />
          <Route path="sales"      element={<ComingSoon label="Billing & Sales (POS)" />} />
          <Route path="customers"  element={<ComingSoon label="Customer Management" />} />
          <Route path="prescriptions" element={<ComingSoon label="Prescription Management" />} />
          <Route path="reports"    element={<ComingSoon label="Reports" />} />
          <Route path="users"      element={<PrivateRoute allowedRoles={['ADMIN']}><ComingSoon label="User Management" /></PrivateRoute>} />
          <Route path="settings"   element={<ComingSoon label="Settings" />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  </BrowserRouter>
);

// ─── Inline placeholder for Phase 1 ──────────────────────────────────────────
function ComingSoon({ label }: { label: string }) {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="60vh"
      gap={2}
    >
      <Box
        sx={{
          fontSize: 64,
          background: 'linear-gradient(135deg, #1976d2, #00897b)',
          borderRadius: '50%',
          width: 100,
          height: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontWeight: 700,
        }}
      >
        {label[0]}
      </Box>
      <Box sx={{ typography: 'h5', fontWeight: 700 }}>{label}</Box>
      <Box sx={{ typography: 'body1', color: 'text.secondary' }}>
        This module will be implemented in Phase 2.
      </Box>
    </Box>
  );
}

export default AppRouter;
