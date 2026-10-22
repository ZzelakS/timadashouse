# Timadashouse Beauty — Configuration and Launch

1. Run `npm install` and copy `.env.example` to `.env.local`. Fill in ImageKit public key and URL endpoint. The Convex development URL is preset.
2. In this project directory, run `npx convex dev --once` while logged into the account owning **adjoining-elk-599**; select the Timadashouse Beauty deployment. This deploys functions and regenerates `convex/_generated`. The URL alone does not grant deployment access.
3. Set Convex environment variables via dashboard or `npx convex env set`: `IMAGEKIT_PRIVATE_KEY` (secret), `STRIPE_SECRET_KEY` (secret), `STRIPE_WEBHOOK_SECRET` (secret), and `SITE_URL` (the full deployed frontend origin, with no trailing slash). Do not commit secrets.
4. Configure Stripe webhook URL `https://adjoining-elk-599.convex.site/timada-stripe-webhook` with `checkout.session.completed`, and test against Stripe test mode first. Do not use live mode before verifying bookings and webhooks.
5. Seed the beauty catalog using the authenticated admin dashboard/Convex mutation `timada:seed` with input from `src/data/timadaServices.ts`; do not seed Calary Beauty. Seeding is idempotent by slug.
6. Run `npm run build`, then deploy Vercel with matching frontend VITE_ variables. Convex production is a separate deployment and needs its own seed and secrets.

**ImageKit security note:** The inherited `/imagekit-auth` endpoint signs upload credentials without verifying an admin session. Before using public admin uploads in production, replace it with an admin-authenticated signer or otherwise restrict signing; a public signing endpoint may allow unauthorized uploads and ImageKit charges. ImageKit private key must never enter browser code.

**Booking readiness:** Stripe Checkout is integrated but neither deployment, live payment verification nor calendar double-booking prevention has been validated. Do not enable live payment collection until those are addressed.
