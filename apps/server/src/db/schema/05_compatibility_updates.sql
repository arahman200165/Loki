alter table users add column if not exists account_locator text;
alter table users add column if not exists display_name text;
alter table devices alter column user_id drop not null;
alter table devices add column if not exists local_lock_enabled boolean not null default false;
alter table devices add column if not exists lock_mode text not null default 'none';
alter table auth_challenges add column if not exists challenge_plain text;
alter table recovery_sessions add column if not exists recovery_challenge_plain text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'uq_users_account_locator'
  ) then
    alter table users add constraint uq_users_account_locator unique (account_locator);
  end if;
end $$;
