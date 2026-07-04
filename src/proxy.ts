import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // --- 1. Passthrough for API routes and Next internals ---
  if (pathname.startsWith("/api") || pathname.startsWith("/_next")) {
    return NextResponse.next();
  }

  const adminHost = process.env.NEXT_PUBLIC_ADMIN_HOST?.trim();
  const host = request.headers.get("host") ?? "";
  const isAdminHost = !!adminHost && host === adminHost;

  // --- 2. Redirect /admin off the public domain to the admin subdomain ---
  if (adminHost && !isAdminHost && pathname.startsWith("/admin")) {
    const url = request.nextUrl.clone();
    url.host = adminHost;
    url.port = "";
    url.pathname = pathname === "/admin" ? "/" : pathname.replace(/^\/admin/, "");
    return NextResponse.redirect(url);
  }

  // --- 3. On the admin host, map root-level paths into /admin ---
  let adminPath = pathname;
  let rewriteUrl: URL | null = null;

  if (isAdminHost && !pathname.startsWith("/admin")) {
    adminPath = pathname === "/" ? "/admin" : `/admin${pathname}`;
    rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = adminPath;
  }

  // --- 4. Cookie handling ---
  const cookiesToApply: CookieToSet[] = [];
  const applyCookies = (res: NextResponse) => {
    cookiesToApply.forEach(({ name, value, options }) =>
      res.cookies.set(name, value, options),
    );
    return res;
  };

  // --- 5. Only run Supabase auth on admin routes ---
  let user = null;
  const isAdminArea = adminPath.startsWith("/admin");
  const isLogin = adminPath === "/admin/login";

  if (isAdminArea) {
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

    const result = await supabase.auth.getUser();
    user = result.data.user;
  }

  // --- 6. Admin auth guards ---
  if (isAdminArea && !isLogin && !user) {
    const url = request.nextUrl.clone();
    url.pathname = isAdminHost ? "/login" : "/admin/login";
    url.searchParams.set("redirect", pathname);
    return applyCookies(NextResponse.redirect(url));
  }

  if (isLogin && user) {
    const url = request.nextUrl.clone();
    url.pathname = isAdminHost ? "/" : "/admin";
    url.searchParams.delete("redirect");
    return applyCookies(NextResponse.redirect(url));
  }

  // --- 7. Rewrite admin paths ---
  if (rewriteUrl) {
    return applyCookies(NextResponse.rewrite(rewriteUrl, { request }));
  }

  // --- 8. Built-in Next.js 16 proxy for Supabase API ---
  if (pathname.startsWith("/supabase")) {
    const target = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const newUrl = target + pathname.replace(/^\/supabase/, "");

    return fetch(newUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body,
    }).then((res) => {
      return new NextResponse(res.body, {
        status: res.status,
        headers: res.headers,
      });
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
