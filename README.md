# BrandLinker Headquarters

Official website for **BrandLinker** — the central agency and holding house behind four flagship ventures:

1. **Cheap Ticket Finder** — Online travel booking platform for flights, hotels, and tickets.
2. **Brand Linker Dubai** — Brand entry, distribution, localization, and real estate related projects in Dubai & GCC.
3. **Brand Linker Spark** — Premium dropshipping store with selected products and global shipping.
4. **SheRides (`sherides.online`)** — Women-only ride sharing service in Bangladesh focused on safety and community for female riders.

## Live Domain
- Production: `https://brandlinkerbd.com`
- Deployed via Vercel with automatic deployments from `main`.

## Private Business Dashboard (`/dashboard`, owner-only)
Static UI (`dashboard.html`, `assets/js/dashboard.js`) + Vercel functions in `api/`. All data comes from the central DB contract RPCs, server-side only.

Server env vars (names only; never commit values):
- Auth: `DASHBOARD_SESSION_SECRET` (random, ≥32 chars), `DASHBOARD_OWNER_PASSWORD_HASH`, optional `DASHBOARD_VIEWER_PASSWORD_HASH` (read-only role). Generate a hash with `node scripts/hash-password.js` (type the password, press Enter).
- Central DB: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `BL_CLIENT_ID`, `BL_CLIENT_SECRET`. Never a service-role key (refused if supplied).

Missing auth env → sign-in disabled ("Not configured"). Missing DB env → "Not configured"; DB errors → "Unavailable"/"Failed". Never zeros.

Tests: `npm test` (node:test unit), `npm run test:e2e` (Playwright/Chromium, mocked DB), `npm run check`.
