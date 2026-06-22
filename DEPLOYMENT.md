# Deployment Guide — Ride Access NYC

This guide walks through deploying the platform to **Vercel** with
**Supabase** (database/auth), **Stripe** (payments), and **Resend** (email).

---

## 1. Supabase Setup

1. Create a project at [supabase.com](https://supabase.com).
2. In **Project Settings → API**, copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)
3. Open **SQL Editor**, paste the contents of [`supabase/schema.sql`](supabase/schema.sql), and **Run**.
   This creates all tables, enums, RLS policies, and seed testimonials.

### Create an admin user

1. In **Authentication → Users**, click **Add user** and create an account
   (email + password). Copy the new user's UUID.
2. In the **SQL Editor**, run (replace the values):

   ```sql
   insert into admins (id, email, full_name, role)
   values ('PASTE-USER-UUID', 'you@example.com', 'Your Name', 'superadmin');
   ```

3. You can now sign in at `/admin/login`.

### Run the invoices migration

The invoice maker uses an extra table. In the **SQL Editor**, also run
[`supabase/invoices.sql`](supabase/invoices.sql) once (creates the `invoices`
table, auto-numbering sequence, and RLS policy).

---

## 1b. Admin Dashboard on Its Own Subdomain

The dashboard can be served on a dedicated subdomain
(`admin.rideaccessnyc.com`) so it is fully separate from the public marketing
site but still talks to the same Supabase backend. This is controlled by one
env var — when unset (local dev), the dashboard simply stays at `/admin`.

1. In Vercel → **Settings → Domains**, add `admin.rideaccessnyc.com` to the
   **same project**.
2. At your DNS provider, add a **CNAME**: `admin` → `cname.vercel-dns.com`.
3. In **Settings → Environment Variables**, set (Production):
   ```
   NEXT_PUBLIC_ADMIN_HOST=admin.rideaccessnyc.com
   ```
4. Redeploy.

Result:
- `admin.rideaccessnyc.com` serves the dashboard at its root
  (`/` → login/dashboard). Public marketing pages are not reachable there.
- On `www.rideaccessnyc.com`, any `/admin` URL is redirected to the admin
  subdomain, keeping the dashboard off the public site.

> The split is implemented in [`src/middleware.ts`](src/middleware.ts) via
> hostname-based rewriting — it's the same deployment, so no separate backend
> or config is needed.

---

## 2. Stripe Setup

1. Create a [Stripe](https://stripe.com) account.
2. From **Developers → API keys**, copy:
   - `Secret key` → `STRIPE_SECRET_KEY`
   - `Publishable key` → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
3. Enable **Apple Pay / Google Pay / Link** in **Settings → Payment methods**.
4. After deploying, add a webhook (**Developers → Webhooks → Add endpoint**):
   - URL: `https://www.rideaccessnyc.com/api/webhooks/stripe`
   - Events: `checkout.session.completed`, `checkout.session.expired`,
     `payment_intent.payment_failed`
   - Copy the **Signing secret** → `WEBHOOK_SECRET`

### Local webhook testing

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# use the printed whsec_... as WEBHOOK_SECRET in .env.local
```

---

## 3. Resend (Email) Setup

1. Create a [Resend](https://resend.com) account and verify your sending
   domain (e.g. `rideaccessnyc.com`).
2. Copy the API key → `RESEND_API_KEY`.
3. Set `EMAIL_FROM="Ride Access NYC <bookings@rideaccessnyc.com>"` and
   `ADMIN_NOTIFY_EMAIL=contact@rideaccessnyc.com`.

> Without `RESEND_API_KEY`, email sending is skipped gracefully — bookings
> still save to the database.

---

## 4. Google Maps

1. In the [Google Cloud Console](https://console.cloud.google.com), enable
   **Maps JavaScript API**, **Maps Embed API**, **Places API** (autocomplete),
   and **Geocoding API**.
2. Create an API key and set `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`.
3. **Restrict the key to your domains** under **Credentials → your key →
   Application restrictions → Websites**, adding:
   - `https://rideaccessnyc.com/*`
   - `https://www.rideaccessnyc.com/*`
   - `https://admin.rideaccessnyc.com/*` (if you map the dashboard there)
   - `http://localhost:3000/*` (for local development)

> **"This IP, site or mobile application is not authorized to use this API
> key"** means the current origin isn't in the allowlist above — add it (and
> allow a few minutes to propagate). Without a key, maps fall back to the
> keyless public embed.

---

## 5. AI Assistant (optional)

Set `ANTHROPIC_API_KEY` to enable the Claude-backed support assistant
(model `claude-sonnet-4-6`). Without it, the assistant uses a built-in
rule-based knowledge engine grounded in your services & FAQ.

---

## 5b. Photos / Imagery

All site photography is defined in one place:
[`src/lib/data/photos.ts`](src/lib/data/photos.ts). Defaults use
**Unsplash** (free for commercial use, no attribution required).

To use your **own** photos (recommended for maximum trust):

1. Drop image files into `public/` (e.g. `public/fleet/van-1.jpg`).
2. In `src/lib/data/photos.ts`, replace the `src` values with the local path
   (e.g. `src: "/fleet/van-1.jpg"`). Keep the `alt` text accurate.

To swap a stock image instead, paste a different Unsplash `photo-xxxx` id into
the `unsplash(...)` call. The `images.unsplash.com` host is already allowlisted
in [`next.config.ts`](next.config.ts); add any new external host there too.

---

## 5c. Live Chat (Tawk.to)

**Status: DISABLED** — Tawk widget has been removed from the website.

The `<LiveChat />` component has been removed from `src/app/layout.tsx`. 
To re-enable Tawk in the future:
1. Restore the import: `import { LiveChat } from "@/components/LiveChat";`
2. Add `<LiveChat />` component back to the layout
3. Set `NEXT_PUBLIC_TAWK_PROPERTY_ID` and `NEXT_PUBLIC_TAWK_WIDGET_ID` in environment variables

---

## 6. Deploy to Vercel

1. Push the repo to GitHub/GitLab.
2. Import the project at [vercel.com/new](https://vercel.com/new).
3. Add **all** environment variables from `.env.example` in
   **Project Settings → Environment Variables** (Production + Preview).
4. Set `NEXT_PUBLIC_SITE_URL=https://www.rideaccessnyc.com`.
5. Deploy. Vercel auto-detects Next.js — no extra config needed.

### Domain

1. **Settings → Domains** → add `rideaccessnyc.com` and `www.rideaccessnyc.com`.
2. Point your DNS per Vercel's instructions (A / CNAME records).
3. Set `www` as primary (redirect apex → www, or vice-versa).

---

## 7. Post-Deploy Checklist

- [ ] `supabase/schema.sql` **and** `supabase/invoices.sql` executed; admin user inserted into `admins`
- [ ] All env vars set in Vercel (Production)
- [ ] (Optional) `admin.rideaccessnyc.com` subdomain added + `NEXT_PUBLIC_ADMIN_HOST` set
- [ ] Google Maps key restricted to your domains (incl. `localhost` for dev)
- [ ] Stripe webhook endpoint added with correct `WEBHOOK_SECRET`
- [ ] Resend domain verified
- [ ] Test a booking → confirm row in `bookings` + confirmation email
- [ ] Test a payment with Stripe test card `4242 4242 4242 4242`
- [ ] Sign in at `/admin/login` and verify the dashboard loads
- [ ] Submit the sitemap (`/sitemap.xml`) in Google Search Console
- [ ] Run Lighthouse — target Performance 95+, Accessibility 100, SEO 100

---

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Bookings don't save | Check `SUPABASE_SERVICE_ROLE_KEY` and that `schema.sql` ran |
| Admin redirect loop | Ensure your user has a row in the `admins` table |
| Payments fail to start | Verify `STRIPE_SECRET_KEY` is set (server-side) |
| Webhook 400 | `WEBHOOK_SECRET` mismatch — re-copy from Stripe dashboard |
| Emails not arriving | Verify Resend domain + `EMAIL_FROM` uses that domain |
