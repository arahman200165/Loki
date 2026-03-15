create table if not exists device_link_sessions (
  id uuid primary key,
  pending_device_id uuid not null references devices(id) on delete cascade,
  requesting_user_id uuid references users(id) on delete set null,
  manual_code_hash text not null,
  qr_payload_hash text not null,
  status text not null default 'pending',
  encrypted_bootstrap_bundle text,
  approved_by_device_id uuid references devices(id) on delete set null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  completed_at timestamptz
);

create table if not exists recovery_sessions (
  id uuid primary key,
  user_id uuid not null references users(id) on delete cascade,
  pending_device_id uuid not null references devices(id) on delete cascade,
  recovery_challenge_plain text not null,
  recovery_challenge_hash text not null,
  status text not null default 'pending',
  expires_at timestamptz not null,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);
