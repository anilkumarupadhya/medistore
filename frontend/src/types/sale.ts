export type SaleStatus        = 'COMPLETED' | 'RETURNED' | 'CANCELLED';
export type SalePaymentMethod = 'CASH' | 'CARD' | 'UPI' | 'NETBANKING' | 'CHEQUE' | 'CREDIT';
export type SalePaymentStatus = 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE';

export interface SaleItem {
  id:                number;
  medicine:          string;
  medicine_name:     string;
  medicine_category: string;
  batch_number:      string;
  expiry_date:       string | null;
  quantity:          number;
  unit_price:        string;
  mrp:               string;
  discount_pct:      string;
  discount_amount:   string;
  gst_percentage:    string;
  gst_amount:        string;
  total_amount:      string;
}

export interface Sale {
  id:                    string;
  invoice_number:        string;
  customer:              string | null;
  customer_name:         string | null;
  status:                SaleStatus;
  subtotal:              string;
  discount_amount:       string;
  tax_amount:            string;
  total_amount:          string;
  amount_paid:           string;
  change_amount:         string;
  payment_method:        SalePaymentMethod;
  payment_status:        SalePaymentStatus;
  loyalty_points_used:   number;
  loyalty_points_earned: number;
  notes:                 string;
  created_by_name:       string | null;
  item_count?:           number;
  items?:                SaleItem[];
  created_at:            string;
  updated_at:            string;
}

export interface SaleItemForm {
  medicine_id:    string;
  medicine_name:  string;   // display only
  unit_price:     number;
  mrp:            number;
  gst_percentage: number;
  batch_number:   string;
  quantity:       number;
  discount_pct:   number;
}

export interface SaleForm {
  customer_id:     string;
  items:           SaleItemForm[];
  discount_amount: number;
  amount_paid:     number;
  payment_method:  SalePaymentMethod;
  notes:           string;
}

export interface SaleSummary {
  today_count:   number;
  today_revenue: number;
  month_count:   number;
  month_revenue: number;
  total_count:   number;
  total_revenue: number;
}

export interface SaleFilters {
  search?:    string;
  status?:    SaleStatus | '';
  date_from?: string;
  date_to?:   string;
  page?:      number;
  page_size?: number;
}

export interface SaleListResponse {
  count:     number;
  page:      number;
  page_size: number;
  results:   Sale[];
}

export const SALE_STATUS_OPTIONS: { value: SaleStatus; label: string; color: string }[] = [
  { value: 'COMPLETED', label: 'Completed', color: '#2e7d32' },
  { value: 'RETURNED',  label: 'Returned',  color: '#f57c00' },
  { value: 'CANCELLED', label: 'Cancelled', color: '#d32f2f' },
];

export const SALE_PAYMENT_METHOD_OPTIONS = [
  { value: 'CASH',       label: 'Cash' },
  { value: 'CARD',       label: 'Card' },
  { value: 'UPI',        label: 'UPI' },
  { value: 'NETBANKING', label: 'Net Banking' },
  { value: 'CHEQUE',     label: 'Cheque' },
  { value: 'CREDIT',     label: 'Credit' },
];

export const SALE_PAYMENT_STATUS_COLOR: Record<SalePaymentStatus, string> = {
  PENDING: '#f57c00',
  PARTIAL: '#1976d2',
  PAID:    '#2e7d32',
  OVERDUE: '#d32f2f',
};
