export interface SalesTotals {
  total_count: number;
  total_revenue: number;
  total_paid: number;
}

export interface DailySalesRow {
  date: string;
  count: number;
  revenue: number;
  paid: number;
}

export interface TopMedicineRow {
  name: string;
  category: string;
  total_qty: number;
  total_revenue: number;
}

export interface PaymentBreakdownRow {
  method: string;
  count: number;
  total: number;
}

export interface SalesReport {
  totals: SalesTotals;
  daily: DailySalesRow[];
  top_medicines: TopMedicineRow[];
  payment_breakdown: PaymentBreakdownRow[];
}

export interface InventorySummary {
  total_medicines: number;
  total_stock_value: number;
  selling_stock_value: number;
  potential_profit: number;
  low_stock_count: number;
  out_of_stock_count: number;
  expiring_soon_count: number;
  expired_count: number;
}

export interface CategoryBreakdownRow {
  category: string;
  count: number;
  total_stock: number;
}

export interface LowStockRow {
  id: string;
  name: string;
  category: string;
  stock_quantity: number;
  reorder_level: number;
  unit: string;
}

export interface ExpiringRow {
  id: string;
  name: string;
  expiry_date: string;
  stock_quantity: number;
  unit: string;
}

export interface InventoryReport {
  summary: InventorySummary;
  category_breakdown: CategoryBreakdownRow[];
  low_stock: LowStockRow[];
  expiring: ExpiringRow[];
  expired: ExpiringRow[];
}

export interface PurchaseTotals {
  total_orders: number;
  total_value: number;
  total_paid: number;
  outstanding: number;
}

export interface BySupplierRow {
  supplier: string;
  orders: number;
  total: number;
  paid: number;
}

export interface ByStatusRow {
  status: string;
  count: number;
  total: number;
}

export interface TopPurchaseMedicineRow {
  name: string;
  total_qty: number;
  total_value: number;
}

export interface PurchaseReport {
  totals: PurchaseTotals;
  by_supplier: BySupplierRow[];
  by_status: ByStatusRow[];
  top_medicines: TopPurchaseMedicineRow[];
}

export interface ReportFilters {
  date_from?: string;
  date_to?: string;
}
