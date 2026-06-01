import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, Chip, Divider, Grid, alpha,
  Table, TableHead, TableRow, TableCell, TableBody,
  CircularProgress,
} from '@mui/material';
import { LocalShipping, Cancel } from '@mui/icons-material';
import { usePurchase } from '../../../hooks/usePurchases';
import type { PurchaseOrder } from '../../../types/purchase';
import { PURCHASE_STATUS_OPTIONS, PAYMENT_STATUS_COLOR } from '../../../types/purchase';

interface Props {
  open:       boolean;
  onClose:    () => void;
  purchaseId: string | null;
  canWrite:   boolean;
  onReceive?: (po: PurchaseOrder) => void;
  onCancel?:  (id: string, poNumber: string) => void;
}

const AmountRow: React.FC<{ label: string; value: string | number; bold?: boolean; color?: string }> = ({
  label, value, bold, color,
}) => (
  <Box display="flex" justifyContent="space-between" py={0.4}>
    <Typography variant="body2" color="text.secondary">{label}</Typography>
    <Typography variant="body2" fontWeight={bold ? 800 : 500} color={color ?? 'text.primary'}>
      {value}
    </Typography>
  </Box>
);

const PurchaseDetailDialog: React.FC<Props> = ({
  open, onClose, purchaseId, canWrite, onReceive, onCancel,
}) => {
  const { data: po, isLoading } = usePurchase(purchaseId ?? '');

  const statusOpt = PURCHASE_STATUS_OPTIONS.find(o => o.value === po?.status);
  const balance   = po ? Number(po.total_amount) - Number(po.amount_paid) : 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}>

      <DialogTitle sx={{ pb: 1 }}>
        {isLoading || !po ? (
          <Typography variant="h6" fontWeight={800}>Loading…</Typography>
        ) : (
          <Box display="flex" alignItems="flex-start" justifyContent="space-between" gap={1} flexWrap="wrap">
            <Box>
              <Typography variant="h6" fontWeight={800}>{po.po_number}</Typography>
              <Typography variant="body2" color="text.secondary">
                Supplier: <strong>{po.supplier_name || '—'}</strong>
                {po.created_by_name && ` · Created by ${po.created_by_name}`}
              </Typography>
            </Box>
            <Box display="flex" gap={1} alignItems="center">
              <Chip
                label={statusOpt?.label ?? po.status}
                size="small"
                sx={{
                  fontWeight: 700, fontSize: '0.72rem',
                  background: alpha(statusOpt?.color ?? '#616161', 0.12),
                  color: statusOpt?.color ?? '#616161',
                }}
              />
              <Chip
                label={po.payment_status}
                size="small"
                sx={{
                  fontWeight: 700, fontSize: '0.72rem',
                  background: alpha(PAYMENT_STATUS_COLOR[po.payment_status] ?? '#616161', 0.12),
                  color: PAYMENT_STATUS_COLOR[po.payment_status] ?? '#616161',
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

        {!isLoading && po && (
          <>
            {/* Order meta */}
            <Grid container spacing={2} mb={2.5}>
              {[
                { label: 'Invoice No.',   value: po.invoice_number || '—' },
                { label: 'Invoice Date',  value: po.invoice_date ? new Date(po.invoice_date).toLocaleDateString('en-IN') : '—' },
                { label: 'Order Date',    value: new Date(po.created_at).toLocaleDateString('en-IN') },
                { label: 'Received At',   value: po.received_at ? new Date(po.received_at).toLocaleString('en-IN') : '—' },
                { label: 'Payment Method', value: po.payment_method ?? '—' },
              ].map(({ label, value }) => (
                <Grid item xs={6} sm={4} md={2.4} key={label}>
                  <Box sx={{ p: 1.5, borderRadius: 1.5, background: (t) => alpha(t.palette.action.hover, 1) }}>
                    <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
                    <Typography variant="body2" fontWeight={600}>{value}</Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>

            {/* Line items */}
            <Typography variant="subtitle2" fontWeight={700} mb={1}>
              Items ({po.items?.length ?? 0})
            </Typography>
            <Box sx={{ overflowX: 'auto', mb: 2.5 }}>
              <Table size="small" sx={{ minWidth: 640 }}>
                <TableHead>
                  <TableRow sx={{ background: (t) => t.palette.mode === 'dark' ? '#0a1929' : '#f4f6f9' }}>
                    {['Medicine', 'Batch', 'Expiry', 'Qty', 'Free', 'Purchase ₹', 'Selling ₹', 'MRP ₹', 'Disc%', 'GST%', 'Total ₹'].map(h => (
                      <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.72rem', whiteSpace: 'nowrap' }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(po.items ?? []).map((item, i) => (
                    <TableRow key={item.id ?? i} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{item.medicine_name}</Typography>
                        <Typography variant="caption" color="text.secondary">{item.medicine_category}</Typography>
                      </TableCell>
                      <TableCell><Typography variant="body2">{item.batch_number || '—'}</Typography></TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {item.expiry_date ? new Date(item.expiry_date).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }) : '—'}
                        </Typography>
                      </TableCell>
                      <TableCell><Typography variant="body2" fontWeight={700}>{item.quantity}</Typography></TableCell>
                      <TableCell><Typography variant="body2">{item.free_quantity || 0}</Typography></TableCell>
                      <TableCell><Typography variant="body2">₹{Number(item.purchase_price).toFixed(2)}</Typography></TableCell>
                      <TableCell><Typography variant="body2">₹{Number(item.selling_price).toFixed(2)}</Typography></TableCell>
                      <TableCell><Typography variant="body2">₹{Number(item.mrp).toFixed(2)}</Typography></TableCell>
                      <TableCell><Typography variant="body2">{item.discount_pct}%</Typography></TableCell>
                      <TableCell><Typography variant="body2">{item.gst_percentage}%</Typography></TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={700}>
                          ₹{Number(item.total_amount).toLocaleString('en-IN')}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!po.items || po.items.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={11} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                        No items found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Box>

            {/* Totals + notes side by side */}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                {po.notes && (
                  <Box sx={{ p: 1.5, borderRadius: 1.5, background: (t) => alpha(t.palette.action.hover, 1), height: '100%' }}>
                    <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>Notes</Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{po.notes}</Typography>
                  </Box>
                )}
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ p: 2, borderRadius: 1.5, border: '1px solid', borderColor: 'divider' }}>
                  <AmountRow label="Subtotal"   value={`₹${Number(po.subtotal).toLocaleString('en-IN')}`} />
                  <AmountRow label="Discount"   value={`-₹${Number(po.discount_amount).toLocaleString('en-IN')}`} color="#d32f2f" />
                  <AmountRow label="GST / Tax"  value={`₹${Number(po.tax_amount).toLocaleString('en-IN')}`} />
                  <Divider sx={{ my: 0.75 }} />
                  <AmountRow label="Total"      value={`₹${Number(po.total_amount).toLocaleString('en-IN')}`} bold />
                  <AmountRow label="Paid"        value={`₹${Number(po.amount_paid).toLocaleString('en-IN')}`} color="#2e7d32" />
                  <AmountRow
                    label="Balance Due"
                    value={`₹${balance.toLocaleString('en-IN')}`}
                    bold
                    color={balance > 0 ? '#d32f2f' : '#2e7d32'}
                  />
                </Box>
              </Grid>
            </Grid>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={onClose}>Close</Button>
        {canWrite && po && ['DRAFT', 'ORDERED'].includes(po.status) && onCancel && (
          <Button
            variant="outlined" color="error" startIcon={<Cancel />}
            onClick={() => { onClose(); onCancel(po.id, po.po_number); }}
          >
            Cancel Order
          </Button>
        )}
        {canWrite && po && ['DRAFT', 'ORDERED', 'PARTIALLY_RECEIVED'].includes(po.status) && onReceive && (
          <Button
            variant="contained" color="success" startIcon={<LocalShipping />}
            onClick={() => { onClose(); onReceive(po); }}
          >
            Receive Stock
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default PurchaseDetailDialog;
