// Web app manifest for the admin PWA. Served under /api (not the reserved
// global app/manifest.ts, and not under the auth-guarded /admin tree) and
// linked ONLY from the admin layout — so the public marketing site is never
// installable and the manifest itself is always fetchable during install.
export function GET() {
  const manifest = {
    name: "Ride Access Admin",
    short_name: "RA Admin",
    description: "Ride Access NYC admin — bookings, leads, and payments.",
    start_url: "/admin",
    scope: "/admin",
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
