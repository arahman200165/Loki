// DB row shapes and API wire types for auth and accounts

export interface AccountRow {
  id: string;
  username: string;
  password_hash: string;
  created_at: Date;
  deleted_at: Date | null;
}

export interface SessionRow {
  token: string;
  account_id: string;
  device_id: string;
  issued_at: Date;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    username: string;
  };
}

export interface RegisterRequest {
  username: string;
  password: string;
}

export interface RegisterResponse {
  token: string;
  user: {
    id: string;
    username: string;
  };
}

export interface LogoutResponse {
  status: 'ok';
}

export interface ApiErrorResponse {
  error: string;
  code?: string;
}
