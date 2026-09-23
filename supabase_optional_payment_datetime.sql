-- Payment date/time are no longer collected by the registration form.
-- Preserve existing values and allow new submissions to omit these fields.
begin;
alter table public.houston_registrations
  alter column payment_date drop not null,
  alter column payment_time drop not null;
commit;
