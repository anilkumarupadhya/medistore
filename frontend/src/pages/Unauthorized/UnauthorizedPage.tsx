import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { LockOutlined } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="100vh" gap={2}>
      <LockOutlined sx={{ fontSize: 72, color: 'error.main' }} />
      <Typography variant="h4" fontWeight={700}>Access Denied</Typography>
      <Typography color="text.secondary">You do not have permission to view this page.</Typography>
      <Button variant="contained" onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
    </Box>
  );
};

export default UnauthorizedPage;
