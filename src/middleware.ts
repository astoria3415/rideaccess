import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

/**
 * Middleware responsibilities:
 *
 *  1. Subdomain split — when NEXT_PUBLIC_ADMIN_HOST is set (e.g.
 *     "admin.rideaccessnyc.com"), the dashboard lives on that host only:
 *       - On the admin host, the /admin section is served at the root
 *         ("/" -> "/admin", "/bookings" -> "/admin/bookings"), so the
 *         public marketing pages are not reachable there.
 *       - On the public host, any /admin URL is redirected to the admin
 *         host, keeping the dashboard off the marketing domain.
 *     When the env var is unset (local dev, where subdomains are awkward),
 *     the dashboard simply stays at /admin on the same host.
 *
 *  2. Auth — refreshes the Supabase session and guards admin pages,
 *     redirecting unauthenticated users to the login screen.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Check for API routes and Next internals first.
  const isPassthrough =
    pathname.startsWith("/api") || pathname.startsWith("/_next");

  // 2. IMMEDIATELY exit and let API requests proceed untouched.
  // This ensures booking emails fire smoothly without auth interference.
  if (isPassthrough) {
    return NextResponse.next();
  }

  const adminHost = process.env.NEXT_PUBLIC_ADMIN_HOST?.trim();
  const host = request.headers.get("host") ?? "";
  const isAdminHost = !!adminHost && host === adminHost;

  // --- Redirect /admin off the public domain to the admin subdomain. ---
  if (adminHost && !isAdminHost && pathname.startsWith("/admin")) {
    const url = request.nextUrl.clone();
    url.host = adminHost;
    url.port = "";
    url.pathname = pathname === "/admin" ? "/" : pathname.replace(/^\/admin/, "");
    return NextResponse.redirect(url);
  }

  // --- On the admin host, map root-level paths into the /admin section. ---
  let adminPath = pathname; // the effective admin-relative path for auth checks
  let rewriteUrl: URL | null = null;
  if (isAdminHost && !pathname.startsWith("/admin")) {
    adminPath = pathname === "/" ? "/admin" : `/admin${pathname}`;
    rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = adminPath;
  }

  // --- Supabase session refresh (collect cookies to apply to final response). ---
  const cookiesToApply: CookieToSet[] = [];
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          cookiesToApply.push(...cookiesToSet);
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAdminArea = adminPath.startsWith("/admin");
  const isLogin = adminPath === "/admin/login";

  const applyCookies = (res: NextResponse) => {
    cookiesToApply.forEach(({ name, value, options }) =>
      res.cookies.set(name, value, options),
    );
    return res;
  };

  // Guard: unauthenticated users hitting the dashboard go to login.
  if (isAdminArea && !isLogin && !user) {
    const url = request.nextUrl.clone();
    // On the admin host the login page is at the root "/login".
    url.pathname = isAdminHost ? "/login" : "/admin/login";
    url.searchParams.set("redirect", pathname);
    return applyCookies(NextResponse.redirect(url));
  }

  // Already logged in and on the login page -> send to dashboard home.
  if (isLogin && user) {
    const url = request.nextUrl.clone();
    url.pathname = isAdminHost ? "/" : "/admin";
    url.searchParams.delete("redirect");
    return applyCookies(NextResponse.redirect(url));
  }

  return applyCookies(
    rewriteUrl
      ? NextResponse.rewrite(rewriteUrl, { request })
      : NextResponse.next({ request }),
  );
}

export const config = {
  // Run on everything except static assets/files so the subdomain rewrite
  // can map root paths into /admin. Auth logic still only acts on admin paths.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};