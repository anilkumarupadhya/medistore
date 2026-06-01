import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  IconButton,
  InputAdornment,
  Alert,
  Divider,
  Chip,
  CircularProgress,
  useTheme,
  useMediaQuery,
  alpha,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  LocalPharmacy,
  LockOutlined,
  EmailOutlined,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Navigate } from 'react-router-dom';
import { useLogin } from '../../hooks/useAuth';
import { useAuthStore } from '../../store/authStore';
import type { LoginRequest } from '../../types/auth';

// ─── Validation schema ────────────────────────────────────────────────────────
const schema = yup.object({
  email: yup.string().email('Enter a valid email').required('Email is required'),
  password: yup.string().min(6, 'Minimum 6 characters').required('Password is required'),
});

// ─── Demo credential cards ────────────────────────────────────────────────────
const DEMO_CREDENTIALS = [
  { role: 'Admin',             email: 'admin@medistore.com',       password: 'Admin@1234',     color: '#d32f2f' },
  { role: 'Pharmacist',        email: 'pharmacist@medistore.com',  password: 'Pharma@1234',    color: '#1976d2' },
  { role: 'Cashier',           email: 'cashier@medistore.com',     password: 'Cashier@1234',   color: '#388e3c' },
  { role: 'Inventory Manager', email: 'inventory@medistore.com',   password: 'Inventory@1234', color: '#f57c00' },
];

// ─── Component ────────────────────────────────────────────────────────────────
const LoginPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [showPassword, setShowPassword] = useState(false);
  const { isAuthenticated } = useAuthStore();
  const loginMutation = useLogin();

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginRequest>({ resolver: yupResolver(schema) });

  // Already logged in → go to dashboard
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const onSubmit = (data: LoginRequest) => loginMutation.mutate(data);

  const fillDemo = (email: string, password: string) => {
    setValue('email', email);
    setValue('password', password);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        background: `linear-gradient(135deg, #0f2942 0%, #1565c0 50%, #00897b 100%)`,
      }}
    >
      {/* ── Left panel (brand) — hidden on mobile ─────────────────────────── */}
      {!isMobile && (
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            p: 6,
            color: '#fff',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Decorative circles */}
          {[200, 340, 480].map((size, i) => (
            <Box
              key={i}
              sx={{
                position: 'absolute',
                width: size,
                height: size,
                borderRadius: '50%',
                border: `1px solid ${alpha('#fff', 0.08)}`,
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            />
          ))}

          <LocalPharmacy sx={{ fontSize: 72, mb: 3, color: alpha('#fff', 0.95) }} />
          <Typography variant="h3" fontWeight={800} textAlign="center" gutterBottom>
            MediStore Pro
          </Typography>
          <Typography variant="h6" textAlign="center" sx={{ opacity: 0.8, maxWidth: 380, lineHeight: 1.7 }}>
            Complete Pharmacy Management System for modern retail and wholesale pharmacies.
          </Typography>

          <Box sx={{ mt: 6, display: 'flex', flexDirection: 'column', gap: 2, width: '100%', maxWidth: 380 }}>
            {['Role-Based Access Control', 'POS Billing with Barcode', 'Inventory & Expiry Tracking', 'GST Reports & Analytics'].map((f) => (
              <Box key={f} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: '#69f0ae',
                    flexShrink: 0,
                  }}
                />
                <Typography variant="body1" sx={{ opacity: 0.85 }}>
                  {f}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* ── Right panel (login form) ──────────────────────────────────────── */}
      <Box
        sx={{
          width: { xs: '100%', md: 480 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: { xs: 2, sm: 4 },
          background: alpha('#fff', 0.04),
          backdropFilter: 'blur(20px)',
        }}
      >
        <Card
          sx={{
            width: '100%',
            maxWidth: 420,
            background: '#fff',
            borderRadius: 3,
            overflow: 'visible',
          }}
          elevation={24}
        >
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            {/* Header */}
            <Box textAlign="center" mb={3}>
              {isMobile && (
                <LocalPharmacy sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
              )}
              <Typography variant="h5" fontWeight={700} color="text.primary">
                Sign in to MediStore
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={0.5}>
                Enter your credentials to continue
              </Typography>
            </Box>

            {/* Error alert */}
            {loginMutation.isError && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                Invalid email or password. Please try again.
              </Alert>
            )}

            {/* Form */}
            <Box
              component="form"
              onSubmit={handleSubmit(onSubmit)}
              noValidate
              sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}
            >
              <Controller
                name="email"
                control={control}
                defaultValue=""
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Email Address"
                    type="email"
                    autoComplete="email"
                    autoFocus
                    error={!!errors.email}
                    helperText={errors.email?.message}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailOutlined color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
              />

              <Controller
                name="password"
                control={control}
                defaultValue=""
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    error={!!errors.password}
                    helperText={errors.password?.message}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockOutlined color="action" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPassword((s) => !s)} edge="end" size="small">
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={loginMutation.isPending}
                sx={{ py: 1.5, mt: 0.5 }}
              >
                {loginMutation.isPending ? (
                  <CircularProgress size={22} color="inherit" />
                ) : (
                  'Sign In'
                )}
              </Button>
            </Box>

            {/* Demo credentials */}
            <Divider sx={{ my: 3 }}>
              <Typography variant="caption" color="text.secondary">
                DEMO CREDENTIALS
              </Typography>
            </Divider>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
              {DEMO_CREDENTIALS.map(({ role, email, password, color }) => (
                <Button
                  key={role}
                  variant="outlined"
                  size="small"
                  onClick={() => fillDemo(email, password)}
                  sx={{
                    borderColor: alpha(color, 0.4),
                    color: color,
                    fontSize: '0.72rem',
                    py: 0.8,
                    '&:hover': {
                      borderColor: color,
                      background: alpha(color, 0.06),
                    },
                  }}
                >
                  {role}
                </Button>
              ))}
            </Box>

            <Typography variant="caption" color="text.secondary" display="block" textAlign="center" mt={2}>
              Click a role button to auto-fill credentials
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default LoginPage;
