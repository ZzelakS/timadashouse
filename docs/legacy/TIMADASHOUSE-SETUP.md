# Timadashouse Beauty — setup

Based on the supplied Calary Beauty React/Vite/TypeScript/Tailwind/Convex architecture. Existing Calary code is retained for admin compatibility; the Timadashouse storefront uses separate `timadaServices` and `timadaBookings` tables. **Do not connect this copy to the Calary Beauty production Convex deployment.**

1. Run `npm install` then `npx convex dev` and select a **new** Timadashouse project. Set `VITE_CONVEX_URL` (and other existing Convex Auth variables) for the new project only.
2. Set server Convex env vars: `SITE_URL=https://your-new-site.example`, `STRIPE_SECRET_KEY=sk_...`, `STRIPE_WEBHOOK_SECRET=whsec_...`. Never put Stripe secret keys in a `VITE_` variable.
3. Create a Stripe webhook at `https://YOUR-DEPLOYMENT.convex.site/timada-stripe-webhook`, subscribe to `checkout.session.completed`, and set the signing secret in Convex.
4. The service catalog is bundled in `src/data/timadaServices.ts`. To seed the DB, sign in as a Convex admin, then from a trusted admin interface invoke `api.timada.seed` with the full catalog mapped to `{slug,category,name,price,duration,description}`. Seeding is idempotent; it does not overwrite existing admin edits. **This ZIP does not claim that the live database was seeded.**
5. Stripe Checkout is $50 USD non-refundable per appointment; services priced below $50 and services without confirmed prices cannot be paid/booked online. This avoids overcharging. For those services, offer direct salon consultation. Stripe webhooks mark appointments confirmed only after completed and paid status. Appointments are not yet checked against a shared staff calendar; times are client requested, not guaranteed by availability. Configure scheduling validation before going live.
6. Test webhooks (including retries), time slot concurrency, form validation, site URL CORS, accessibility, and appointment management before taking real money.
7. Footer developer credit is only `Lamar` with prefilled WhatsApp message. Verify the developer phone number in `src/App.tsx` before publication.
