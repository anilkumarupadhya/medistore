export interface Supplier {
  id:              string;
  name:            string;
  contact_person:  string;
  mobile:          string;
  email:           string | null;
  address:         string;
  city:            string;
  state:           string;
  pincode:         string;
  gst_number:      string | null;
  payment_terms:   number;
  opening_balance: string;
  is_active:       boolean;
  notes:           string;
  created_at:      string;
  updated_at:      string;
}

export interface SupplierFormValues {
  name:            string;
  contact_person:  string;
  mobile:          string;
  email:           string;
  address:         string;
  city:            string;
  state:           string;
  pincode:         string;
  gst_number:      string;
  payment_terms:   number;
  opening_balance: number;
  is_active:       boolean;
  notes:           string;
}

export interface SupplierFilters {
  search?:    string;
  is_active?: boolean | '';
  page?:      number;
  page_size?: number;
}

export interface SupplierListResponse {
  count:     number;
  page:      number;
  page_size: number;
  results:   Supplier[];
}

export const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh',
  'Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka',
  'Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram',
  'Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana',
  'Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  'Andaman and Nicobar Islands','Chandigarh','Dadra and Nagar Haveli',
  'Daman and Diu','Delhi','Jammu and Kashmir','Ladakh','Lakshadweep','Puducherry',
];
