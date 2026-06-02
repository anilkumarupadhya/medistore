export interface Prescription {
  id: string;
  customer: string | null;
  customer_name: string;
  doctor_name: string;
  doctor_reg_no: string;
  file_url: string;
  notes: string;
  uploaded_by: string | null;
  uploaded_by_name: string;
  created_at: string;
}

export interface PrescriptionFormValues {
  customer: string | null;
  doctor_name: string;
  doctor_reg_no: string;
  file_url: string;
  notes: string;
}

export interface PrescriptionFilters {
  search?: string;
  customer_id?: string;
  page?: number;
  page_size?: number;
}

export interface PrescriptionListResponse {
  count: number;
  page: number;
  page_size: number;
  results: Prescription[];
}
