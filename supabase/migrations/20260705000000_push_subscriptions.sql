-- Web Push subscriptions for the admin PWA. Each admin device that opts in
-- stores one row here; the server fans a notification out to every row so
-- both the owner and his partner are alerted at the same time.
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists push_subscriptions_admin_id_idx
  on public.push_subscriptions (admin_id);

alter table public.push_subscriptions enable row level security;

-- An admin may only manage their own subscriptions. The server send path
-- uses the service-role key and bypasses RLS entirely.
drop policy if exists "own push subscriptions" on public.push_subscriptions;
create policy "own push subscriptions" on public.push_subscriptions
  for all to authenticated
  using (is_admin() and admin_id = auth.uid())
  with check (is_admin() and admin_id = auth.uid());
