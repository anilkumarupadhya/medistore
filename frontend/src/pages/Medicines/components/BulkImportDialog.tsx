import React, { useCallback, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, LinearProgress, Alert, alpha,
} from '@mui/material';
import { UploadFile, FileDownload } from '@mui/icons-material';
import { useBulkImport } from '../../../hooks/useMedicines';

interface Props {
  open: boolean;
  onClose: () => void;
}

const BulkImportDialog: React.FC<Props> = ({ open, onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const mutation = useBulkImport();

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  }, []);

  const handleImport = () => {
    if (!file) return;
    mutation.mutate(file, {
      onSuccess: () => { setFile(null); onClose(); },
    });
  };

  const downloadTemplate = () => {
    const headers = [
      'name','generic_name','brand_name','category','manufacturer',
      'barcode','batch_number','purchase_price','selling_price','mrp',
      'gst_percentage','hsn_code','reorder_level','unit',
      'manufacturing_date','expiry_date','is_prescription','notes',
    ];
    const sample = [
      'Paracetamol 500mg','Paracetamol','Crocin','TABLET','GSK',
      '8901234560099','B-001','12','18','20',
      '12','30049099','50','Strip',
      '2024-01-01','2026-12-31','No','Sample medicine',
    ];
    const csv = [headers.join(','), sample.join(',')].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'medicines_template.csv'; a.click();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 700 }}>Bulk Import Medicines</DialogTitle>
      <DialogContent>
        <Button startIcon={<FileDownload />} size="small" onClick={downloadTemplate} sx={{ mb: 2 }}>
          Download Template (CSV)
        </Button>

        <Box
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => document.getElementById('bulk-file-input')?.click()}
          sx={{
            border: '2px dashed',
            borderColor: dragOver ? 'primary.main' : 'divider',
            borderRadius: 2,
            p: 4,
            textAlign: 'center',
            cursor: 'pointer',
            background: dragOver ? (theme => alpha(theme.palette.primary.main, 0.05)) : 'transparent',
            transition: 'all 0.2s',
          }}
        >
          <input
            id="bulk-file-input"
            type="file"
            accept=".xlsx,.xls"
            hidden
            onChange={e => setFile(e.target.files?.[0] ?? null)}
          />
          <UploadFile sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography variant="body1" fontWeight={600}>
            {file ? file.name : 'Click or drag & drop your Excel file here'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Supports .xlsx and .xls, max 5 MB
          </Typography>
        </Box>

        {mutation.isPending && <LinearProgress sx={{ mt: 2, borderRadius: 1 }} />}
        {mutation.isError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            Import failed. Please check your file format.
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleImport}
          disabled={!file || mutation.isPending}
        >
          Import
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BulkImportDialog;
