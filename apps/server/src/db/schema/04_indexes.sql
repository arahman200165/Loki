create unique index if not exists uq_device_prekeys_device_keyid
  on device_prekeys(device_id, key_id);

create index if not exists idx_devices_user_id on devices(user_id);
create index if not exists idx_devices_user_trust_status on devices(user_id, trust_status);
create index if not exists idx_auth_challenges_device_id on auth_challenges(device_id);
create index if not exists idx_auth_challenges_expires_at on auth_challenges(expires_at);
create index if not exists idx_auth_sessions_user_id on auth_sessions(user_id);
create index if not exists idx_auth_sessions_device_id on auth_sessions(device_id);
create index if not exists idx_auth_sessions_expires_at on auth_sessions(expires_at);
create unique index if not exists uq_web_sessions_token_hash
  on web_sessions(session_token_hash);
create index if not exists idx_web_sessions_expires_at on web_sessions(expires_at);
create index if not exists idx_device_link_sessions_pending_device_id
  on device_link_sessions(pending_device_id);
create index if not exists idx_device_link_sessions_status on device_link_sessions(status);
create index if not exists idx_device_link_sessions_expires_at on device_link_sessions(expires_at);
