# Warraq Launch Checklist

Updated: 2026-09-18

## Completed

- [x] Source hardened and merged to `main`
- [x] Production release published under `/warraq/`
- [x] Real-email signup and password recovery
- [x] Legacy account email-upgrade path
- [x] Strong password requirements
- [x] Free HIBP compromised-password screening
- [x] Passwords removed from localStorage
- [x] RLS and column-level privilege hardening
- [x] Privileged RPC logic moved behind private schema
- [x] Public seller profile projection excludes phone/email
- [x] Reports, blocking and reviews
- [x] Seller payout ledger and admin settlement tracking
- [x] Account deletion request workflow
- [x] In-app notification backend + UI
- [x] Message and order-state notification triggers
- [x] Input validation and database constraints
- [x] PWA service worker
- [x] iPhone safe-area support
- [x] Accessible viewport zoom
- [x] CSP
- [x] Privacy policy
- [x] Terms of use
- [x] SEO metadata
- [x] Transaction lifecycle rollback tests
- [x] Notification/deletion workflow rollback tests
- [x] Security Advisor reviewed
- [x] Warraq-specific missing indexes resolved
- [x] Payment entry point visibly paused until gateway activation

## Account settings already prepared

- [x] Supabase URL Configuration prepared by project owner:
  - Site URL: `https://byyassmin.com/warraq/`
  - Redirect URL: `https://byyassmin.com/warraq/**`

## Deferred intentionally

### Thawani
Do this last, after a merchant/business account is available.

Backend code is already prepared:
- `warraq-create-thawani-session`
- `warraq-verify-thawani-payment`
- `warraq-thawani-webhook`

Required server-only secrets:
- `THAWANI_SECRET_KEY`
- `THAWANI_PUBLISHABLE_KEY`
- `THAWANI_MODE`

Merchant webhook:
`https://eooytvurkabmiooknbgk.supabase.co/functions/v1/warraq-thawani-webhook`

Until the gateway is activated:
- UI shows payment as coming soon.
- No new paid orders can be initiated from the normal user interface.
- Browsing, listing, cart, messaging, reports, reviews infrastructure and admin tools remain available.

## Final manual QA before public announcement

Test on a real iPhone/Safari and desktop:
- [ ] Create a fresh account
- [ ] Confirm email
- [ ] Complete profile
- [ ] Add a book with 3 images
- [ ] Browse/search/filter
- [ ] Add/remove from cart
- [ ] Start a conversation
- [ ] Receive in-app notification
- [ ] Block a user and confirm messaging is blocked
- [ ] Submit a report
- [ ] Request account deletion
- [ ] Install as PWA on iPhone Home Screen
- [ ] Verify bottom navigation safe-area spacing
- [ ] Verify privacy and terms pages

Payment QA is deferred until Thawani merchant activation.
