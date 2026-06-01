import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, Chip, Divider, Grid, alpha,
  Table, TableHead, TableRow, TableCell, TableBody,
  CircularProgress,
} from '@mui/material';
import { useSale } from '../../../hooks/useSales';
import { SALE_STATUS_OPTIONS, SALE_PAYMENT_STATUS_COLOR } from '../../../types/sale';

interface Props {
  open:    boolean;
  onClose: () => void;
  saleId:  string | null;
}

const Row: React.FC<{ label: string; value: React.ReactNode; bold?: boolean; color?: string }> = ({
  label, value, bold, color,
}) => (
  <Box display="flex" justifyContent="space-between" py={0.4}>
    <Typography variant="body2" color="text.secondary">{label}</Typography>
    <Typography variant="body2" fontWeight={bold ? 800 : 500} color={color ?? 'text.primary'}>
      {value}
    </Typography>
  </Box>
);

const SaleDetailDialog: React.FC<Props> = ({ open, onClose, saleId }) => {
  const { data: sale, isLoading } = useSale(saleId ?? '');

  const statusOpt = SALE_STATUS_OPTIONS.find(o => o.value === sale?.status);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}>

      <DialogTitle sx={{ pb: 1 }}>
        {isLoading || !sale ? (
          <Typography variant="h6" fontWeight={800}>Loading…</Typography>
        ) : (
          <Box display="flex" alignItems="flex-start" justifyContent="space-between" gap={1} flexWrap="wrap">
            <Box>
              <Typography variant="h6" fontWeight={800}>{sale.invoice_number}</Typography>
              <Typography variant="body2" color="text.secondary">
                {sale.customer_name ? `Customer: ${sale.customer_name}` : 'Walk-in Customer'}
                {sale.created_by_name && ` · Billed by ${sale.created_by_name}`}
              </Typography>
            </Box>
            <Box display="flex" gap={1}>
              <Chip
                label={statusOpt?.label ?? sale.status}
                size="small"
                sx={{
                  fontWeight: 700, fontSize: '0.72rem',
                  background: alpha(statusOpt?.color ?? '#616161', 0.12),
                  color: statusOpt?.color ?? '#616161',
                }}
              />
              <Chip
                label={sale.payment_status}
                size="small"
                sx={{
                  fontWeight: 700, fontSize: '0.72rem',
                  background: alpha(SALE_PAYMENT_STATUS_COLOR[sale.payment_status] ?? '#616161', 0.12),
                  color: SALE_PAYMENT_STATUS_COLOR[sale.payment_status] ?? '#616161',
                }}
              />
            </Box>
          </Box>
        )}
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 2 }}>
        {isLoading && (
          <Box display="flex" justifyContent="center" py={5}>
            <CircularProgress />
          </Box>
        )}

        {!isLoading && sale && (
          <>
            {/* Meta strip */}
            <Grid container spacing={2} mb={2.5}>
              {[
                { label: 'Date',           value: new Date(sale.created_at).toLocaleString('en-IN') },
                { label: 'Payment Method', value: sale.payment_method },
                { label: 'Items',          value: sale.items?.length ?? '—' },
              ].map(({ label, value }) => (
                <Grid item xs={6} sm={4} key={label}>
                  <Box sx={{ p: 1.5, borderRadius: 1.5, background: (t) => alpha(t.palette.action.hover, 1) }}>
                    <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
                    <Typography variant="body2" fontWeight={600}>{value}</Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>

            {/* Line items */}
            <Typography variant="subtitle2" fontWeight={700} mb={1}>
              Items ({sale.items?.length ?? 0})
            </Typography>
            <Box sx={{ overflowX: 'auto', mb: 2.5 }}>
              <Table size="small" sx={{ minWidth: 560 }}>
                <TableHead>
                  <TableRow sx={{ background: (t) => t.palette.mode === 'dark' ? '#0a1929' : '#f4f6f9' }}>
                    {['Medicine', 'Qty', 'Unit Price', 'Disc%', 'GST%', 'Total'].map(h => (
                      <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.72rem' }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(sale.items ?? []).map((item, i) => (
                    <TableRow key={item.id ?? i} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{item.medicine_name}</Typography>
                        {item.batch_number && (
                          <Typography variant="caption" color="text.secondary">Batch: {item.batch_number}</Typography>
                        )}
                      </TableCell>
                      <TableCell><Typography variant="body2" fontWeight={700}>{item.quantity}</Typography></TableCell>
                      <TableCell><Typography variant="body2">₹{Number(item.unit_price).toFixed(2)}</Typography></TableCell>
                      <TableCell><Typography variant="body2">{item.discount_pct}%</Typography></TableCell>
                      <TableCell><Typography variant="body2">{item.gst_percentage}%</Typography></TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={700}>
                          ₹{Number(item.total_amount).toLocaleString('en-IN')}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>

            {/* Totals + notes */}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                {sale.notes && (
                  <Box sx={{ p: 1.5, borderRadius: 1.5, background: (t) => alpha(t.palette.action.hover, 1) }}>
                    <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>Notes</Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{sale.notes}</Typography>
                  </Box>
                )}
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ p: 2, borderRadius: 1.5, border: '1px solid', borderColor: 'divider' }}>
                  <Row label="Subtotal"    value={`₹${Number(sale.subtotal).toLocaleString('en-IN')}`} />
                  <Row label="Discount"    value={`-₹${Number(sale.discount_amount).toLocaleString('en-IN')}`} color="#d32f2f" />
                  <Row label="GST"         value={`₹${Number(sale.tax_amount).toLocaleString('en-IN')}`} />
                  <Divider sx={{ my: 0.75 }} />
                  <Row label="Total"       value={`₹${Number(sale.total_amount).toLocaleString('en-IN')}`} bold />
                  <Row label="Amount Paid" value={`₹${Number(sale.amount_paid).toLocaleString('en-IN')}`} color="#2e7d32" />
                  <Row label="Change"      value={`₹${Number(sale.change_amount).toLocaleString('en-IN')}`} />
                </Box>
              </Grid>
            </Grid>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default SaleDetailDialog;
