export type MedicineCategory =
  | 'TABLET' | 'CAPSULE' | 'SYRUP' | 'INJECTION' | 'OINTMENT'
  | 'DROPS' | 'INHALER' | 'POWDER' | 'SUPPOSITORY' | 'PATCH' | 'OTHER';

export const MEDICINE_CATEGORIES: { value: MedicineCategory; label: string }[] = [
  { value: 'TABLET',      label: 'Tablet' },
  { value: 'CAPSULE',     label: 'Capsule' },
  { value: 'SYRUP',       label: 'Syrup' },
  { value: 'INJECTION',   label: 'Injection' },
  { value: 'OINTMENT',    label: 'Ointment' },
  { value: 'DROPS',       label: 'Drops' },
  { value: 'INHALER',     label: 'Inhaler' },
  { value: 'POWDER',      label: 'Powder' },
  { value: 'SUPPOSITORY', label: 'Suppository' },
  { value: 'PATCH',       label: 'Patch' },
  { value: 'OTHER',       label: 'Other' },
];

export const GST_OPTIONS = [0, 5, 12, 18, 28];

export const UNIT_OPTIONS = ['Strip', 'Bottle', 'Tube', 'Vial', 'Box', 'Sachet', 'Ampoule', 'Each'];

export interface Medicine {
  id: string;
  name: string;
  generic_name: string;
  brand_name: string;
  category: MedicineCategory;
  manufacturer: string;
  barcode: string | null;
  batch_number: string;
  purchase_price: string;
  selling_price: string;
  mrp: string;
  gst_percentage: string;
  hsn_code: string;
  stock_quantity: number;
  reorder_level: number;
  unit: string;
  manufacturing_date: string | null;
  expiry_date: string | null;
  is_prescription: boolean;
  is_active: boolean;
  notes: string;
  is_low_stock: boolean;
  is_expired: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface MedicineFormValues {
  name: string;
  generic_name: string;
  brand_name: string;
  category: MedicineCategory;
  manufacturer: string;
  barcode: string;
  batch_number: string;
  purchase_price: number | string;
  selling_price: number | string;
  mrp: number | string;
  gst_percentage: number | string;
  hsn_code: string;
  reorder_level: number | string;
  unit: string;
  manufacturing_date: string;
  expiry_date: string;
  is_prescription: boolean;
  is_active: boolean;
  notes: string;
}

export interface MedicineListResponse {
  count: number;
  total_pages: number;
  current_page: number;
  next: string | null;
  previous: string | null;
  results: Medicine[];
}

export interface MedicineFilters {
  search?: string;
  category?: MedicineCategory | '';
  is_active?: boolean | '';
  is_prescription?: boolean | '';
  low_stock?: boolean;
  ordering?: string;
  page?: number;
  page_size?: number;
}
