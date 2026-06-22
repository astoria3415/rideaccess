-- ════════════════════════════════════════════════════════════════
-- Ride Access NYC — Invoices
-- Run this in the Supabase SQL Editor to add invoicing to an existing
-- database. (Also included in schema.sql for fresh installs.)
-- Idempotent: safe to re-run.
-- ════════════════════════════════════════════════════════════════

create sequence if not exists invoice_number_seq;

create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  -- Auto-formatted like INV-2026-0001
  invoice_number text unique not null default (
    'INV-' || to_char(now(), 'YYYY') || '-' ||
    lpad(nextval('invoice_number_seq')::text, 4, '0')
  ),
  booking_id uuid references bookings(id) on delete set null,
  payment_id uuid references payments(id) on delete set null,
  customer_name text not null,
  customer_email text,
  -- [{ "description": "...", "quantity": 1, "unit_cents": 6500 }]
  line_items jsonb not null default '[]'::jsonb,
  subtotal_cents integer not null default 0,
  tax_cents integer not null default 0,
  total_cents integer not null default 0,
  status text not null default 'draft', -- draft | sent | paid
  notes text,
  issued_date date not null default current_date,
  due_date date,
  created_at timestamptz not null default now()
);

create index if not exists idx_invoices_booking on invoices(booking_id);
create index if not exists idx_invoices_created on invoices(created_at desc);

alter table invoices enable row level security;

drop policy if exists "admin all invoices" on invoices;
create policy "admin all invoices" on invoices
  for all to authenticated
  using (is_admin()) with check (is_admin());
