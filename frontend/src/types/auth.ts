// ─── Auth types shared across the frontend ───────────────────────────────────

export type UserRole = 'ADMIN' | 'PHARMACIST' | 'CASHIER' | 'INVENTORY_MANAGER';

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone: string;
  role: UserRole;
  avatar: string | null;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  data: AuthTokens & { user: User; token_type: string };
}

export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
  confirm_new_password: string;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details: Record<string, string[]>;
  };
}
