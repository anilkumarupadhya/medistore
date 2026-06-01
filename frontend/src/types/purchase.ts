export type PurchaseStatus = 'DRAFT' | 'ORDERED' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED';
export type PaymentStatus  = 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE';
export type PaymentMethod  = 'CASH' | 'CARD' | 'UPI' | 'NETBANKING' | 'CHEQUE' | 'CREDIT';

export interface PurchaseItem {
  id:               number;
  medicine:         string;
  medicine_name:    string;
  medicine_category: string;
  batch_number:     string;
  expiry_date:      string | null;
  quantity:         number;
  free_quantity:    number;
  purchase_price:   string;
  selling_price:    string;
  mrp:              string;
  discount_pct:     string;
  gst_percentage:   string;
  gst_amount:       string;
  total_amount:     string;
}

export interface PurchaseOrder {
  id:              string;
  po_number:       string;
  supplier:        string;
  supplier_name:   string;
  status:          PurchaseStatus;
  invoice_number:  string | null;
  invoice_date:    string | null;
  subtotal:        string;
  discount_amount: string;
  tax_amount:      string;
  total_amount:    string;
  amount_paid:     string;
  payment_status:  PaymentStatus;
  payment_method:  PaymentMethod | null;
  notes:           string;
  received_at:     string | null;
  created_by:      string | null;
  created_by_name: string | null;
  created_at:      string;
  item_count?:     number;
  items?:          PurchaseItem[];
}

export interface PurchaseItemForm {
  medicine:       string;
  batch_number:   string;
  expiry_date:    string;
  quantity:       number;
  free_quantity:  number;
  purchase_price: number;
  selling_price:  number;
  mrp:            number;
  discount_pct:   number;
  gst_percentage: number;
}

export interface PurchaseOrderForm {
  supplier:        string;
  invoice_number:  string;
  invoice_date:    string;
  discount_amount: number;
  amount_paid:     number;
  payment_method:  string;
  notes:           string;
  items:           PurchaseItemForm[];
}

export interface GRNForm {
  invoice_number: string;
  invoice_date:   string;
  amount_paid:    number;
  payment_method: string;
  notes:          string;
}

export interface PurchaseFilters {
  search?:      string;
  status?:      PurchaseStatus | '';
  supplier_id?: string;
  date_from?:   string;
  date_to?:     string;
  page?:        number;
  page_size?:   number;
}

export interface PurchaseListResponse {
  count:     number;
  page:      number;
  page_size: number;
  results:   PurchaseOrder[];
}

export interface PurchaseSummary {
  total_orders:  number;
  total_value:   number;
  by_status:     Record<PurchaseStatus, number>;
  pending_count: number;
}

export const PURCHASE_STATUS_OPTIONS: { value: PurchaseStatus; label: string; color: string }[] = [
  { value: 'DRAFT',              label: 'Draft',               color: '#9e9e9e' },
  { value: 'ORDERED',            label: 'Ordered',             color: '#1976d2' },
  { value: 'PARTIALLY_RECEIVED', label: 'Partially Received',  color: '#f57c00' },
  { value: 'RECEIVED',           label: 'Received',            color: '#2e7d32' },
  { value: 'CANCELLED',          label: 'Cancelled',           color: '#d32f2f' },
];

export const PAYMENT_METHOD_OPTIONS = [
  { value: 'CASH',       label: 'Cash' },
  { value: 'CARD',       label: 'Card' },
  { value: 'UPI',        label: 'UPI' },
  { value: 'NETBANKING', label: 'Net Banking' },
  { value: 'CHEQUE',     label: 'Cheque' },
  { value: 'CREDIT',     label: 'Credit' },
];

export const PAYMENT_STATUS_COLOR: Record<PaymentStatus, string> = {
  PENDING: '#f57c00',
  PARTIAL: '#1976d2',
  PAID:    '#2e7d32',
  OVERDUE: '#d32f2f',
};
