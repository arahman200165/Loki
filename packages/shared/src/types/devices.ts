// DB row shapes and API wire types for devices

export interface DeviceRow {
  id: string;
  account_id: string;
  public_key: Uint8Array | null; // null until Sprint 5.7 key generation
  label: string;
  registered_at: Date;
  revoked_at: Date | null;
}

// POST /api/v1/devices/register
export interface RegisterDeviceRequest {
  public_key: string; // base64-encoded; required from Sprint 5.7 onward
  label: string;
}

export interface RegisterDeviceResponse {
  device_id: string;
}

// GET /api/v1/devices
export interface DeviceSummary {
  id: string;
  label: string;
  registered_at: string; // ISO-8601
  is_current_device: boolean;
}

export interface ListDevicesResponse {
  devices: DeviceSummary[];
}

// POST /api/v1/devices/:id/revoke
export interface RevokeDeviceResponse {
  status: 'ok';
}

// GET /api/v1/devices/transfer (Sprint 11)
export interface TransferPackageResponse {
  package: string; // base64-encoded encrypted transfer blob
}

// POST /api/v1/devices/transfer
export interface SubmitTransferPackageRequest {
  package: string; // base64-encoded encrypted transfer blob
}
