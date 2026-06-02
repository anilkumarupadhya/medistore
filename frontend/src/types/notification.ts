export interface LowStockAlert {
  id: string;
  name: string;
  stock_quantity: number;
  reorder_level: number;
  unit: string;
}

export interface OutOfStockAlert {
  id: string;
  name: string;
  unit: string;
}

export interface ExpiringAlert {
  id: string;
  name: string;
  expiry_date: string;
  stock_quantity: number;
  unit: string;
}

export interface NotificationData {
  total_count: number;
  low_stock: LowStockAlert[];
  out_of_stock: OutOfStockAlert[];
  expiring_soon: ExpiringAlert[];
  expired: ExpiringAlert[];
}
