# Warraq v2 — Production Roadmap

Development branch: `warraq-v2-development`

## Completed
- Created a dedicated development branch from `main`.
- Removed password persistence from browser localStorage.
- Restricted sensitive RPC functions from anonymous callers.
- Added a real `pending_payment` order state.
- Prevented new orders from being treated as paid before payment verification.

## Production sequence
1. Security hardening and authentication.
2. Transaction lifecycle and inventory locking.
3. Payment gateway + webhook verification.
4. Seller settlement/commission accounting.
5. Moderation, reports, disputes and trust controls.
6. UI/UX refactor and codebase modularization.
7. PWA, domain, analytics, SEO, monitoring and launch.

## Rules
- Existing unrelated Ezpa tables in the same Supabase project are out of scope and must not be modified.
- No payment is considered successful from browser state alone.
- Production changes are developed on the development branch before merge to `main`.
