import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

/**
 * Server Supabase client (anon key, cookie-aware). Use in Server
 * Components, Route Handlers, and Server Actions for authenticated
 * user context.
 *
 * The return type is pinned to the top-level `@supabase/supabase-js`
 * `SupabaseClient<Database>` so query results infer correctly. (The
 * `supabase-js` bundled inside `@supabase/ssr` resolves our generated
 * schema to `never`, so we normalize on the hoisted package version.)
 */
export async function createClient(): Promise<SupabaseClient<Database>> {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component — safe to ignore when
            // middleware is refreshing sessions.
          }
        },
      },
    },
  ) as unknown as SupabaseClient<Database>;
}
