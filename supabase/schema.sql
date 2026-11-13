-- MK Fruits Panipat — Supabase database schema
-- Table: bookings (fruit feast / table booking requests)
-- Designed to handle thousands of bookings with indexed lookups.

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  ref text unique,
  name text not null,
  phone text not null,
  email text,
  date date not null,
  time text not null,
  guests integer not null check (guests > 0),
  package text not null,
  notes text,
  items jsonb not null default '[]'::jsonb,
  status text not null default 'pending' check (status in ('pending','confirmed','completed','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Safe additions for existing deployments
alter table public.bookings add column if not exists ref text;
alter table public.bookings add column if not exists email text;
alter table public.bookings add column if not exists items jsonb not null default '[]'::jsonb;
alter table public.bookings add column if not exists updated_at timestamptz not null default now();

create unique index if not exists idx_bookings_ref on public.bookings (ref) where ref is not null;
create index if not exists idx_bookings_date on public.bookings (date);
create index if not exists idx_bookings_status on public.bookings (status);
create index if not exists idx_bookings_created_at on public.bookings (created_at desc);
create index if not exists idx_bookings_phone on public.bookings (phone);
