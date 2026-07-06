// Web app manifest for the admin PWA. Served under /api (not the reserved
// global app/manifest.ts, and not under the auth-guarded /admin tree) and
// linked ONLY from the admin layout — so the public marketing site is never
// installable and the manifest itself is always fetchable during install.
export function GET(req: Request) {
  // On the dedicated admin subdomain the proxy maps root paths into /admin, so
  // the app owns the whole origin: install it at "/" with a site-wide scope so
  // it launches to its own home and feels fully standalone. On the public
  // domain (fallback) it stays scoped to /admin.
  const host = req.headers.get("host") ?? "";
  const adminHost = process.env.NEXT_PUBLIC_ADMIN_HOST?.trim();
  const standalone = !!adminHost && host === adminHost;

  const manifest = {
    name: "Ride Access Admin",
    short_name: "RA Admin",
    description: "Ride Access NYC admin — bookings, leads, and payments.",
    start_url: standalone ? "/" : "/admin",
    scope: standalone ? "/" : "/admin",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0F4C81",
    theme_color: "#0F4C81",
    icons: [
      {
        src: "/api/admin/pwa-icon/192",
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable",
      },
      {
        src: "/api/admin/pwa-icon/512",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable",
      },
    ],
  };

  return new Response(JSON.stringify(manifest), {
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
