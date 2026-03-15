create table if not exists users (
  id uuid primary key,
  public_identity_key text not null,
  recovery_public_material text not null,
  account_locator text unique,
  display_name text,
  encrypted_profile_blob text,
  account_status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists devices (
  id uuid primary key,
  user_id uuid references users(id) on delete cascade,
  public_identity_key text not null,
  device_label text,
  platform text not null,
  trust_status text not null default 'pending',
  device_status text not null default 'active',
  local_lock_enabled boolean not null default false,
  lock_mode text not null default 'none',
  last_active_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  revoked_at timestamptz
);

create table if not exists device_prekeys (
  id bigserial primary key,
  device_id uuid not null references devices(id) on delete cascade,
  key_id bigint not null,
  public_key text not null,
  is_consumed boolean not null default false,
  created_at timestamptz not null default now(),
  consumed_at timestamptz
);

create table if not exists user_contact_codes (
  user_id uuid primary key references users(id) on delete cascade,
  contact_code text not null unique,
  created_at timestamptz not null default now()
);
