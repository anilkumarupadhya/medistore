import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, Chip, Divider, Grid, alpha,
} from '@mui/material';
import { Edit, Phone, Email, LocationOn, Business, Notes } from '@mui/icons-material';
import type { Supplier } from '../../../types/supplier';

interface Props {
  open:     boolean;
  onClose:  () => void;
  supplier: Supplier | null;
  onEdit?:  (supplier: Supplier) => void;
}

const Row: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <Box>
    <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
    <Typography variant="body2" fontWeight={600}>{value || '—'}</Typography>
  </Box>
);

const Section: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
  <Box mb={2.5}>
    <Box display="flex" alignItems="center" gap={0.8} mb={1.5}>
      <Box sx={{ color: 'primary.main', display: 'flex' }}>{icon}</Box>
      <Typography variant="subtitle2" fontWeight={700} color="primary.main">{title}</Typography>
    </Box>
    <Grid container spacing={2}>{children}</Grid>
  </Box>
);

const SupplierDetailDialog: React.FC<Props> = ({ open, onClose, supplier, onEdit }) => {
  if (!supplier) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}>

      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" alignItems="flex-start" justifyContent="space-between" gap={1}>
          <Box>
            <Typography variant="h6" fontWeight={800}>{supplier.name}</Typography>
            {supplier.contact_person && (
              <Typography variant="body2" color="text.secondary">{supplier.contact_person}</Typography>
            )}
          </Box>
          <Chip
            label={supplier.is_active ? 'Active' : 'Inactive'}
            size="small"
            color={supplier.is_active ? 'success' : 'default'}
            sx={{ mt: 0.5, fontWeight: 600 }}
          />
        </Box>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 2.5 }}>
        {/* Contact */}
        <Section icon={<Phone fontSize="small" />} title="Contact">
          <Grid item xs={6}><Row label="Mobile" value={supplier.mobile} /></Grid>
          <Grid item xs={6}><Row label="Email"  value={supplier.email} /></Grid>
        </Section>

        {/* Address */}
        <Section icon={<LocationOn fontSize="small" />} title="Address">
          <Grid item xs={12}><Row label="Street Address" value={supplier.address} /></Grid>
          <Grid item xs={4}><Row label="City"    value={supplier.city}    /></Grid>
          <Grid item xs={4}><Row label="State"   value={supplier.state}   /></Grid>
          <Grid item xs={4}><Row label="Pincode" value={supplier.pincode} /></Grid>
        </Section>

        {/* Business */}
        <Section icon={<Business fontSize="small" />} title="Business Details">
          <Grid item xs={6}><Row label="GST Number" value={supplier.gst_number} /></Grid>
          <Grid item xs={3}><Row label="Payment Terms" value={`${supplier.payment_terms} days`} /></Grid>
          <Grid item xs={3}>
            <Row label="Opening Balance" value={`₹${Number(supplier.opening_balance).toLocaleString('en-IN')}`} />
          </Grid>
        </Section>

        {/* Notes */}
        {supplier.notes && (
          <Section icon={<Notes fontSize="small" />} title="Notes">
            <Grid item xs={12}>
              <Box sx={{ p: 1.5, borderRadius: 1.5, background: (t) => alpha(t.palette.action.hover, 1) }}>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{supplier.notes}</Typography>
              </Box>
            </Grid>
          </Section>
        )}

        {/* Timestamps */}
        <Box display="flex" gap={3} mt={1}>
          <Box>
            <Typography variant="caption" color="text.secondary">Created</Typography>
            <Typography variant="caption" display="block">
              {new Date(supplier.created_at).toLocaleString('en-IN')}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Last Updated</Typography>
            <Typography variant="caption" display="block">
              {new Date(supplier.updated_at).toLocaleString('en-IN')}
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={onClose}>Close</Button>
        {onEdit && (
          <Button variant="contained" startIcon={<Edit />} onClick={() => { onClose(); onEdit(supplier); }}>
            Edit
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default SupplierDetailDialog;
