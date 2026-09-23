-- LexGlobal BD Houston Registration — Premium Rebuild Migration
alter table public.houston_registrations
  add column if not exists age integer,
  add column if not exists present_address text,
  add column if not exists division text,
  add column if not exists interested_topic text,
  add column if not exists join_reason text,
  add column if not exists referral_source text;

grant usage on schema public to anon, authenticated;
grant insert on table public.houston_registrations to anon, authenticated;
grant select, update on table public.houston_registrations to authenticated;
grant select on table public.houston_admins to authenticated;

-- Optional data validation for future records.
alter table public.houston_registrations
  drop constraint if exists houston_registrations_age_check;
alter table public.houston_registrations
  add constraint houston_registrations_age_check check (age is null or (age >= 16 and age <= 90));
