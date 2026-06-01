export interface Customer {
  id:              string;
  name:            string;
  mobile:          string;
  email:           string | null;
  address:         string;
  date_of_birth:   string | null;
  loyalty_points:  number;
  opening_balance: string;
  is_active:       boolean;
  notes:           string;
  created_at:      string;
  updated_at:      string;
}

export interface CustomerFormValues {
  name:            string;
  mobile:          string;
  email:           string;
  address:         string;
  date_of_birth:   string;
  opening_balance: number;
  is_active:       boolean;
  notes:           string;
}

export interface CustomerFilters {
  search?:    string;
  is_active?: boolean | '';
  page?:      number;
  page_size?: number;
}

export interface CustomerListResponse {
  count:     number;
  page:      number;
  page_size: number;
  results:   Customer[];
}
