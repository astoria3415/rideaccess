-- ─── Friendly booking numbers ───────────────────────────────────
-- Adds an auto-generated, human-readable confirmation number to
-- bookings, e.g. RA-00012. Mirrors the invoice_number pattern.

create sequence if not exists booking_number_seq start 10000;

alter table bookings
  add column if not exists booking_number text unique;

alter table bookings
  alter column booking_number set default (
    'RA-' || lpad(nextval('booking_number_seq')::text, 5, '0')
  );

-- Backfill any existing rows created before this column existed.
update bookings
set booking_number = 'RA-' || lpad(nextval('booking_number_seq')::text, 5, '0')
where booking_number is null;

-- ─── Customer accounts ──────────────────────────────────────────
-- Link a booking to a signed-in customer (null for guest bookings).
alter table bookings
  add column if not exists user_id uuid references auth.users(id) on delete set null;

create index if not exists idx_bookings_user on bookings(user_id);

alter table bookings enable row level security;

-- Preserve full admin access (dashboard reads/writes via authenticated client).
drop policy if exists "admin all bookings" on bookings;
create policy "admin all bookings" on bookings
  for all to authenticated using (is_admin()) with check (is_admin());

-- Let customers read their own bookings; guests/anon cannot.
drop policy if exists "customers read own bookings" on bookings;
create policy "customers read own bookings" on bookings
  for select to authenticated using (user_id = auth.uid());
