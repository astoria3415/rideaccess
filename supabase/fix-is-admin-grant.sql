-- Fix: signed-in users got "permission denied for function is_admin"
-- because EXECUTE was never granted, so every RLS policy that calls
-- is_admin() failed and the admin dashboard showed Access Not Authorized.
grant execute on function public.is_admin() to authenticated, anon;
