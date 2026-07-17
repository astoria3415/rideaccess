# AccessRide Books — Mobile (iOS & Android)

Expo (React Native) companion app for the Ride Access NYC accounting
platform. It signs into the **same Supabase project** as the web admin, so
the same admin accounts, RLS policies, chart of accounts, and
`post_journal_entry` RPC apply — the web and mobile apps are always in
sync because they share one backend.

## Features

- **Dashboard** — income / expenses / net this month, cash & bank,
  accounts receivable (same ledger math as the web, via the shared pure
  engine in `src/lib/books/`)
- **Expenses** — searchable list plus a New Expense flow with **camera
  receipt capture** (uploads to the private `receipts` bucket) and
  instant on-device category suggestions
- **Bookings** — live view of rides booked on rideaccessnyc.com
- **Reports** — Profit & Loss with period presets

Note: `src/lib/books/ledger.ts` and `reports.ts` are copies of the
tested engines in the web app (`../src/lib/books/`). If you change one,
change both — they are pure TypeScript with no dependencies.

## Run locally

```bash
cd mobile
npm install
cp .env.example .env      # fill in the Supabase URL + anon key from ../.env.local
npx expo start
```

Scan the QR code with the **Expo Go** app (App Store / Play Store) on
your phone, or press `a` for an Android emulator / `i` for an iOS
simulator (Mac only).

Sign in with your existing admin email + password.

## Production builds (EAS)

Native binaries are built in Expo's cloud — this also solves iOS builds
from Windows (no Mac needed):

```bash
npm install -g eas-cli
eas login                 # free Expo account
eas build:configure
eas build --platform android --profile preview   # installable .apk
eas build --platform ios                          # needs an Apple Developer account ($99/yr)
eas submit                                        # store submission, when ready
```

Set the two `EXPO_PUBLIC_*` variables as EAS environment variables
(`eas env:create`) so cloud builds get them.

## Security notes

- Only the **anon key** ships in the app; all data access is enforced by
  Supabase RLS (`is_admin()`), identical to the web admin.
- The Claude API key stays server-side; the on-device category
  suggester is the deterministic keyword engine.
