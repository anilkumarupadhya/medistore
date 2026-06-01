import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import type { UserRole } from '../types/auth';

interface PrivateRouteProps {
  children: React.ReactElement;
  /** If provided, user must have one of these roles. */
  allowedRoles?: UserRole[];
}

/**
 * Wraps protected routes. Redirects to /login if not authenticated.
 * Redirects to /unauthorized if role check fails.
 */
const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default PrivateRoute;
