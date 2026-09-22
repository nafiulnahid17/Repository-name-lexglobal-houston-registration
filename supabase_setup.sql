-- LexGlobal BD Houston Registration System
-- Run this entire script in Supabase Dashboard → SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.houston_registrations (
  id uuid primary key default gen_random_uuid(),
  registration_id text unique not null,
  full_name text not null,
  email text not null,
  mobile text not null,
  whatsapp text not null,
  profession text not null,
  institution text,
  district text not null,
  country text not null default 'Bangladesh',
  facebook_url text,
  preferred_contact text not null default 'WhatsApp',
  payment_method text not null,
  transaction_id text not null,
  payment_mobile text,
  amount_paid numeric(10,2) not null,
  currency text not null default 'BDT',
  payment_date date not null,
  payment_time time not null,
  receipt_path text,
  promo_code text,
  payment_status text not null default 'Pending Verification',
  registration_status text not null default 'Pending Verification',
  created_at timestamptz not null default now(),
  verified_at timestamptz
);

create table if not exists public.houston_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.houston_registrations enable row level security;
alter table public.houston_admins enable row level security;

drop policy if exists "public submit houston registration" on public.houston_registrations;
create policy "public submit houston registration"
on public.houston_registrations
for insert
to anon, authenticated
with check (true);

drop policy if exists "admin read houston registrations" on public.houston_registrations;
create policy "admin read houston registrations"
on public.houston_registrations
for select
to authenticated
using (exists(select 1 from public.houston_admins a where a.user_id=auth.uid()));

drop policy if exists "admin update houston registrations" on public.houston_registrations;
create policy "admin update houston registrations"
on public.houston_registrations
for update
to authenticated
using (exists(select 1 from public.houston_admins a where a.user_id=auth.uid()))
with check (exists(select 1 from public.houston_admins a where a.user_id=auth.uid()));

drop policy if exists "admin read own row" on public.houston_admins;
create policy "admin read own row"
on public.houston_admins
for select
to authenticated
using (user_id=auth.uid());

insert into storage.buckets(id,name,public)
values('payment-receipts','payment-receipts',false)
on conflict(id) do update set public=false;

drop policy if exists "public upload payment receipt" on storage.objects;
create policy "public upload payment receipt"
on storage.objects
for insert
to anon, authenticated
with check(
  bucket_id='payment-receipts'
  and (storage.foldername(name))[1] like 'LGUH-%'
);

drop policy if exists "admin read payment receipt" on storage.objects;
create policy "admin read payment receipt"
on storage.objects
for select
to authenticated
using(
  bucket_id='payment-receipts'
  and exists(select 1 from public.houston_admins a where a.user_id=auth.uid())
);

-- AFTER creating the admin user in Authentication → Users,
-- insert its UUID here:
-- insert into public.houston_admins(user_id)
-- values('PASTE_ADMIN_AUTH_USER_UUID');
