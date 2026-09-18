# Warraq v2 — Production Release

Updated: 2026-09-18

## Production URL
- https://byyassmin.com/warraq/
- Deployment target repository: `turkik69/turkik69.github.io`
- Deployment directory: `/warraq/`
- Source repository: `turkik69/Books`
- Development branch: `warraq-v2-development`

## Backend
Supabase project: `Booksale` (`eooytvurkabmiooknbgk`).

Warraq shares this project with unrelated Ezpa tables. Do not modify tables prefixed with `ezba_`.

### Edge Functions
- `warraq-create-thawani-session`
- `warraq-verify-thawani-payment`\n- `warraq-thawani-webhook`

`warraq-create-thawani-session` and `warraq-verify-thawani-payment` require valid Supabase JWTs. The webhook is intentionally public because Thawani cannot send a user JWT; it never trusts the incoming event as payment proof and re-verifies the stored session directly with Thawani using the server-side secret key.

### Required Edge Function secrets
Do not commit values to GitHub:
- `THAWANI_SECRET_KEY`
- `THAWANI_PUBLISHABLE_KEY`
- `THAWANI_MODE` = `test` or `live`

Optional:
- `WARRAQ_PUBLIC_URL` — defaults to `https://byyassmin.com/warraq`

## Auth dashboard tasks before public launch
In Supabase Dashboard:
1. Authentication → URL Configuration
   - Site URL: `https://byyassmin.com/warraq/`
   - Add Redirect URL: `https://byyassmin.com/warraq/**`
2. Authentication → Providers → Email
   - Keep email confirmations enabled for production.
3. Authentication → Password Security
   - Enable leaked-password protection.

### Thawani webhook\nConfigure the merchant portal webhook to call:\n`https://eooytvurkabmiooknbgk.supabase.co/functions/v1/warraq-thawani-webhook`\n\nThe webhook independently retrieves the checkout session from Thawani before changing order state.\n\n## Payment rules
- Frontend never marks an order paid.
- Payment confirmation is performed server-side against Thawani.
- A book is reserved while payment is pending.
- Payment session expiry is synchronized from the provider when available.
- Abandoned reservations are released by PostgreSQL cron.
- Seller payout is recorded separately from the order.
- Seller settlement is marked paid only by an administrator.

## Delivery
Warraq currently charges no delivery fee.
- Pickup: arranged directly between buyer and seller.
- Delivery: arranged by the two parties.
A delivery fee must not be introduced until an actual delivery partner/service is integrated.

## Security model
- Passwords are never stored in localStorage.
- Sensitive order columns are read-only to browser clients.
- `is_admin`, payment state, commission and settlement values cannot be changed by users.
- Privileged database logic is held in the private schema.
- Public RPCs are SECURITY INVOKER wrappers.
- RLS protects user-owned records.
- Public seller projection excludes email and phone.
- Service role keys and Thawani secret keys must never be exposed to the browser.

## Release process
1. Work on `warraq-v2-development`.
2. Run JavaScript syntax checks.
3. Run Supabase security advisors.
4. Run transactional rollback tests for:
   - create/cancel order
   - paid → shipped → delivered → settled
5. Copy release assets to `turkik69.github.io/warraq/`.
6. Test production URL on Safari/iPhone and desktop.
7. Only then merge source changes to `main`.

## Release assets
- `index.html`
- `app.js`
- `styles.css`
- `service-worker.js`
- `privacy.html`
- `terms.html`

## Rollback
If a frontend release breaks:
- restore the previous versions of the six release files under `turkik69.github.io/warraq/`.
- do not roll back database migrations blindly.
- payment/order database changes require a reviewed forward fix because transactions may already exist.
