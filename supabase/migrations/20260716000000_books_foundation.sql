-- AccessRide Books — Phase 1: double-entry accounting foundation.
--
-- Adds the general ledger (chart of accounts, journal entries, journal
-- lines), vendors, and expenses. Journal balance (debits = credits) is
-- enforced at the database level by a deferred constraint trigger, and
-- writes go through post_journal_entry() so an entry and its lines are
-- always created atomically.

-- ---------------------------------------------------------------------
-- Chart of accounts
-- ---------------------------------------------------------------------
create table if not exists public.ledger_accounts (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  type text not null check (type in ('asset', 'liability', 'equity', 'income', 'expense')),
  subtype text,
  description text,
  -- IRS Schedule C line this account rolls up to (phase 5 tax reports).
  tax_line text,
  -- System accounts are seeded and cannot be deleted from the UI.
  is_system boolean not null default false,
  is_archived boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Journal
-- ---------------------------------------------------------------------
create sequence if not exists public.journal_entry_seq;

create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  entry_number bigint not null default nextval('public.journal_entry_seq'),
  entry_date date not null default current_date,
  memo text,
  -- Where this entry came from: manual, invoice, payment, expense, bank_import…
  source_type text not null default 'manual',
  source_id uuid,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.journal_lines (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.journal_entries (id) on delete cascade,
  account_id uuid not null references public.ledger_accounts (id),
  debit_cents bigint not null default 0 check (debit_cents >= 0),
  credit_cents bigint not null default 0 check (credit_cents >= 0),
  description text,
  constraint journal_line_single_sided
    check ((debit_cents = 0) <> (credit_cents = 0))
);

create index if not exists journal_lines_entry_id_idx on public.journal_lines (entry_id);
create index if not exists journal_lines_account_id_idx on public.journal_lines (account_id);
create index if not exists journal_entries_entry_date_idx on public.journal_entries (entry_date);

-- Every entry must balance by the end of the transaction that touched it.
create or replace function public.assert_entry_balanced()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target uuid;
  imbalance bigint;
  line_count int;
begin
  target := coalesce(new.entry_id, old.entry_id);
  -- Entry deleted (cascade) — nothing left to balance.
  if not exists (select 1 from journal_entries where id = target) then
    return null;
  end if;
  select coalesce(sum(debit_cents - credit_cents), 0), count(*)
    into imbalance, line_count
    from journal_lines
   where entry_id = target;
  if line_count < 2 then
    raise exception 'journal entry % must have at least two lines', target;
  end if;
  if imbalance <> 0 then
    raise exception 'journal entry % is unbalanced by % cents', target, imbalance;
  end if;
  return null;
end;
$$;

drop trigger if exists journal_lines_balanced on public.journal_lines;
create constraint trigger journal_lines_balanced
  after insert or update or delete on public.journal_lines
  deferrable initially deferred
  for each row execute function public.assert_entry_balanced();

-- Atomic entry writer. lines: [{account_id, debit_cents, credit_cents, description}]
create or replace function public.post_journal_entry(
  p_entry_date date,
  p_memo text,
  p_lines jsonb,
  p_source_type text default 'manual',
  p_source_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_entry_id uuid;
begin
  if not is_admin() then
    raise exception 'not authorized';
  end if;
  insert into journal_entries (entry_date, memo, source_type, source_id, created_by)
  values (coalesce(p_entry_date, current_date), p_memo, coalesce(p_source_type, 'manual'), p_source_id, auth.uid())
  returning id into v_entry_id;

  insert into journal_lines (entry_id, account_id, debit_cents, credit_cents, description)
  select
    v_entry_id,
    (l ->> 'account_id')::uuid,
    coalesce((l ->> 'debit_cents')::bigint, 0),
    coalesce((l ->> 'credit_cents')::bigint, 0),
    l ->> 'description'
  from jsonb_array_elements(p_lines) as l;

  return v_entry_id;
end;
$$;

revoke all on function public.post_journal_entry(date, text, jsonb, text, uuid) from public;
grant execute on function public.post_journal_entry(date, text, jsonb, text, uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------
-- Vendors & expenses (records land in phase 2; schema ships now)
-- ---------------------------------------------------------------------
create table if not exists public.vendors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  notes text,
  -- 1099 tracking for phase 5 tax reports.
  is_1099 boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid references public.vendors (id) on delete set null,
  expense_date date not null default current_date,
  amount_cents bigint not null check (amount_cents > 0),
  description text,
  category_account_id uuid references public.ledger_accounts (id),
  payment_account_id uuid references public.ledger_accounts (id),
  receipt_url text,
  journal_entry_id uuid references public.journal_entries (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists expenses_expense_date_idx on public.expenses (expense_date);

-- ---------------------------------------------------------------------
-- Row level security: admin-only, matching the rest of the schema
-- ---------------------------------------------------------------------
alter table public.ledger_accounts enable row level security;
alter table public.journal_entries enable row level security;
alter table public.journal_lines enable row level security;
alter table public.vendors enable row level security;
alter table public.expenses enable row level security;

drop policy if exists "admin all ledger_accounts" on public.ledger_accounts;
create policy "admin all ledger_accounts" on public.ledger_accounts
  to authenticated using (is_admin()) with check (is_admin());

drop policy if exists "admin all journal_entries" on public.journal_entries;
create policy "admin all journal_entries" on public.journal_entries
  to authenticated using (is_admin()) with check (is_admin());

drop policy if exists "admin all journal_lines" on public.journal_lines;
create policy "admin all journal_lines" on public.journal_lines
  to authenticated using (is_admin()) with check (is_admin());

drop policy if exists "admin all vendors" on public.vendors;
create policy "admin all vendors" on public.vendors
  to authenticated using (is_admin()) with check (is_admin());

drop policy if exists "admin all expenses" on public.expenses;
create policy "admin all expenses" on public.expenses
  to authenticated using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------------------
-- Seed chart of accounts (NEMT-tailored, Schedule C mapped)
-- ---------------------------------------------------------------------
insert into public.ledger_accounts (code, name, type, subtype, tax_line, is_system) values
  ('1000', 'Cash on Hand',            'asset',     'cash',                null,                          true),
  ('1010', 'Business Checking',       'asset',     'bank',                null,                          true),
  ('1200', 'Accounts Receivable',     'asset',     'receivable',          null,                          true),
  ('1500', 'Vehicles',                'asset',     'fixed_asset',         null,                          true),
  ('1510', 'Accumulated Depreciation','asset',     'contra_asset',        null,                          true),
  ('1600', 'Equipment',               'asset',     'fixed_asset',         null,                          true),
  ('2000', 'Accounts Payable',        'liability', 'payable',             null,                          true),
  ('2100', 'Business Credit Card',    'liability', 'credit_card',         null,                          true),
  ('2200', 'Sales Tax Payable',       'liability', 'tax',                 null,                          true),
  ('2300', 'Vehicle Loans',           'liability', 'long_term',           null,                          true),
  ('3000', 'Owner''s Equity',         'equity',    'equity',              null,                          true),
  ('3100', 'Owner''s Draws',          'equity',    'draws',               null,                          true),
  ('3900', 'Retained Earnings',       'equity',    'retained',            null,                          true),
  ('4000', 'Ride Revenue',            'income',    'operating',           'gross_receipts',              true),
  ('4100', 'Contract & Facility Revenue', 'income','operating',           'gross_receipts',              true),
  ('4900', 'Other Income',            'income',    'other',               'other_income',                true),
  ('5000', 'Fuel',                    'expense',   'vehicle',             'car_and_truck',               true),
  ('5100', 'Vehicle Maintenance & Repairs', 'expense', 'vehicle',         'repairs_maintenance',         true),
  ('5200', 'Commercial Auto Insurance','expense',  'insurance',           'insurance',                   true),
  ('5300', 'Tolls & Parking',         'expense',   'vehicle',             'car_and_truck',               true),
  ('5400', 'Driver Wages',            'expense',   'payroll',             'wages',                       true),
  ('5500', 'Payroll Taxes',           'expense',   'payroll',             'taxes_licenses',              true),
  ('5600', 'Software & Subscriptions','expense',   'office',              'office_expense',              true),
  ('5700', 'Office Supplies',         'expense',   'office',              'supplies',                    true),
  ('5800', 'Advertising & Marketing', 'expense',   'marketing',           'advertising',                 true),
  ('5900', 'Professional Services',   'expense',   'services',            'legal_professional',          true),
  ('6000', 'Bank & Merchant Fees',    'expense',   'financial',           'other_expenses',              true),
  ('6100', 'Depreciation Expense',    'expense',   'depreciation',        'depreciation',                true),
  ('6200', 'Licenses & Permits',      'expense',   'compliance',          'taxes_licenses',              true),
  ('6900', 'Miscellaneous Expense',   'expense',   'other',               'other_expenses',              true)
on conflict (code) do nothing;
