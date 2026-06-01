export type TxType =
  | 'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT' | 'RETURN' | 'EXPIRED' | 'DAMAGED';

export const TX_TYPE_OPTIONS: { value: TxType; label: string; color: string }[] = [
  { value: 'STOCK_IN',   label: 'Stock In',   color: '#2e7d32' },
  { value: 'STOCK_OUT',  label: 'Stock Out',  color: '#d32f2f' },
  { value: 'ADJUSTMENT', label: 'Adjustment', color: '#f57c00' },
  { value: 'RETURN',     label: 'Return',     color: '#1976d2' },
  { value: 'EXPIRED',    label: 'Expired',    color: '#7b1fa2' },
  { value: 'DAMAGED',    label: 'Damaged',    color: '#795548' },
];

export interface InventoryTransaction {
  id: number;
  medicine: string;
  medicine_name: string;
  medicine_category: string;
  tx_type: TxType;
  quantity: number;
  quantity_before: number;
  quantity_after: number;
  batch_number: string;
  expiry_date: string | null;
  purchase_price: string | null;
  selling_price: string | null;
  reference_type: string;
  reference_id: string | null;
  reason: string;
  created_by: string | null;
  created_by_name: string;
  created_at: string;
}

export interface StockTransactionForm {
  medicine_id: string;
  tx_type: TxType;
  quantity: number;
  batch_number: string;
  expiry_date: string;
  purchase_price: string;
  selling_price: string;
  reason: string;
}

export interface InventorySummary {
  total_medicines: number;
  low_stock_count: number;
  expiring_soon_count: number;
  out_of_stock_count: number;
  total_stock_value: number;
  low_stock_medicines: any[];
  expiring_medicines: any[];
}
