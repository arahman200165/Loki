// DB row shapes and API wire types for the Public-ID system

export interface PublicIdActiveRow {
  id: string;
  account_id: string;
  created_at: Date;
  eligible_for_free_rotation_at: Date;
}

export interface PublicIdHistoryRow {
  id: string;
  account_id: string;
  deprecated_at: Date;
  release_at: Date;
}

// POST /api/v1/public-id/claim
// Always responds 202 { status: 'submitted' } — anti-enumeration invariant
export interface ClaimPublicIdRequest {
  public_id: string;
}

export interface ClaimPublicIdResponse {
  status: 'submitted';
}

// POST /api/v1/public-id/rotate
export interface RotatePublicIdRequest {
  new_public_id: string;
  payment_token?: string; // required if within free-rotation cooldown
}

export interface RotatePublicIdResponse {
  status: 'submitted';
}

// GET /api/v1/public-id/status
export interface PublicIdStatusResponse {
  id: string;
  eligible_for_free_rotation_at: string; // ISO-8601
}
