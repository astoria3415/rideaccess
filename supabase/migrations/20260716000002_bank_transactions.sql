-- AccessRide Books — Phase 4: CSV bank statement import.
--
-- Each imported statement row lands here once (the fingerprint is a
-- stable hash of account + date + amount + description, unique per
-- account, so re-importing the same file is a no-op). Rows are then
-- either matched to an existing journal entry or categorized, which
-- posts a new entry.

create table if not exists public.bank_transactions (
  id uuid primary key default gen_random_uuid(),
  -- The ledger account this statement belongs to (checking, credit card…)
  account_id uuid not null references public.ledger_accounts (id),
  txn_date date not null,
  description text not null,
  -- Signed: positive = money in, negative = money out.
  amount_cents bigint not null,
  fingerprint text not null,
  status text not null default 'unmatched'
    check (status in ('unmatched', 'matched', 'categorized', 'excluded')),
  journal_entry_id uuid references public.journal_entries (id) on delete set null,
  import_batch uuid not null,
  created_at timestamptz not null default now(),
  unique (account_id, fingerprint)
);

create index if not exists bank_transactions_status_idx
  on public.bank_transactions (status);
create index if not exists bank_transactions_txn_date_idx
  on public.bank_transactions (txn_date);

alter table public.bank_transactions enable row level security;

drop policy if exists "admin all bank_transactions" on public.bank_transactions;
create policy "admin all bank_transactions" on public.bank_transactions
  to authenticated using (is_admin()) with check (is_admin());
