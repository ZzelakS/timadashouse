# Timadashouse Beauty — deployment instructions

**Latest revision:** Deploy the included Convex backend before publishing this frontend: the public menu now uses `timada:catalog` to distinguish an unseeded catalogue from an intentionally emptied one. The 60 original beauty services appear first with category links; the 21 kids services follow. Run the existing idempotent seed on the intended deployment to enable bookings against real service records.

## What is included

The existing React/Vite/Convex architecture is preserved. The public menu and studio service editor now use the same `timadaServices` table, and appointment management reads actual Stripe bookings from `timadaBookings`.

- Canonical origin: `https://www.timadashouseglam.com`. The apex domain redirects to www on Vercel. Page metadata, robots.txt and sitemap use the official domain.
- 81 services: all 60 original beauty services plus the supplied 21 kids’ services. The original consultation-only prices remain unknown rather than invented. Kids’ services without a supplied duration have no timeframe text.
- Every available service has a Book button. Services priced at $50 or more use the fixed $50 USD Stripe deposit. Lower-priced and consultation services submit an **unpaid booking request** for studio review. Requests are never displayed as paid appointments. Add-ons should be combined with a style when arranging the final booking.
- Services can be created, edited, hidden, marked unavailable/out of stock, and deleted in Studio Login. Hidden/deleted services stay hidden even when the live catalogue is empty. Unavailable services remain visible but cannot be booked; the backend also rejects checkout for them.
- Product administration and image management are retained. Product drafts and out-of-stock flags are separate. The current public Timadashouse design is service-focused; it does not include an active product checkout. Legacy Authorize.net payment routes are disabled.
- Separate `/training` sign-up page; registrations and progress status are managed in Studio Login → Training sign-ups. These are inquiries, without payment or guaranteed places. The listed subjects are expressions of interest, not a promise that a scheduled course exists.
- Policy accordions, PMU candidacy/preparation/consent/aftercare/FAQ, kids menu and complimentary drinks. All supplied reference content is represented as extracted text; the supplied images are not included in the deployed site. The six policy sections preserve the wording in the supplied images, typos, card-on-file requirement, minor consent wording and cancellation terms. PMU pages display the original supplied wording as selectable page text. No policy wording has been reconciled with the checkout implementation.
- Navbar logo is slightly larger. Lamar’s original WhatsApp footer tag is preserved.

## 1. Install and verify locally

Use Node.js 22.12 or newer (Node 24 recommended).

```sh
npm ci
npm test
npm run build
npm run dev
```

Copy `.env.example` to `.env.local`, replace `VITE_CONVEX_URL` with the **Timadashouse** deployment URL, and restart Vite. Do not reuse Calary’s Convex deployment. Without a valid URL, the public menu uses the bundled catalogue; admin, payments, requests and training submissions are unavailable. The included `dist/` is a credential-free preview build: rebuild with your own production public environment before publishing.

## 2. Configure Convex and authentication

Connect to the intended project:

```sh
npx convex dev
npx @convex-dev/auth
```

Follow the authentication utility’s setup to configure the deployment’s signing key and JWKS. Configure the values in `.env.server.example` on **that same Convex deployment** using its dashboard or `npx convex env set`. Server values do not belong in Vite/Vercel public environment variables.

Set:

```text
SITE_URL=https://www.timadashouseglam.com
ADMIN_EMAILS=timadashouse@gmail.com,timadashouse@yahoo.com
```

For local payment testing, set the development deployment’s `SITE_URL` to the exact local frontend origin, such as `http://localhost:5173`. Production must use the www HTTPS origin. Preview origins require their own matching development configuration.

### Admin email/password accounts — no enrollment code

Only `Timadashouse@gmail.com` and `Timadashouse@yahoo.com` are accepted, normalized to lowercase. Public account creation is disabled. The deployment owner creates each account privately, and the backend issues its admin grant as part of that operation. Knowing an approved email address does not grant access.

1. Deploy this backend to the intended project (`npx convex dev --once` for development, or `npx convex deploy` for production).
2. Open that deployment’s Convex dashboard and go to Functions. Select the internal function `adminAccounts:provision`.
3. Supply the approved `email` and a unique `password` of at least 12 characters, then run the function privately. It returns the email and user ID, never the password. The password is hashed by Convex Auth.
4. Repeat for the second approved email if both accounts are needed.
5. Open `/admin` and sign in with email and password. There is no enrollment-code field and no public Create account button.

Development and production have separate accounts. Existing accounts with valid server-owned admin grants continue to sign in. Existing ungranted legacy accounts require owner review; this change does not automatically trust their email or reset their passwords. Keep passwords private and do not send them in this chat. `ADMIN_ENROLLMENT_SECRET` is no longer used and can be removed from either deployment if previously configured.

## 3. Seed services safely

Deploy or sync the backend before seeding. Run against the intended development deployment:

```sh
npx convex run seedTimada:run
```

For production after `npx convex deploy`:

```sh
npx convex run --prod seedTimada:run
```

This is an internal mutation invoked through deployment-authorized tooling. It inserts missing slugs and reports `{total, added, skipped}`. It does not delete records or overwrite edited names, prices, visibility or stock status. There are 81 starter slugs. Save the returned result as verification; nothing in this handoff proves a live seed happened.

The authorized dashboard’s Add missing starter services button uses the same catalogue and also preserves existing edits. It can re-add a deleted starter if deliberately invoked again. To keep a starter unavailable through future seeds, hide it rather than deleting it.

## 4. Stripe — test before accepting money

Set these **server-side in Convex**:

```text
STRIPE_SECRET_KEY=<Stripe test secret key first>
STRIPE_WEBHOOK_SECRET=<secret for this endpoint and mode>
SITE_URL=https://www.timadashouseglam.com
```

No frontend Stripe key is required for this hosted Checkout redirect flow.

Create a Stripe webhook endpoint:

```text
https://YOUR-DEPLOYMENT.convex.site/timada-stripe-webhook
```

Subscribe to `checkout.session.completed` and `checkout.session.async_payment_succeeded`. Use the endpoint’s signing secret. Test and live endpoints/secrets are different.

Verification steps:

1. Seed a priced service and open Book. Accept the policies and submit a future appointment.
2. Stripe Checkout must show **exactly $50.00 USD**. Test with Stripe’s documented test cards, never real cards in test mode.
3. Verify the event was delivered successfully, the correct `timadaBookings` record becomes `confirmed`, and Studio Login shows the paid deposit.
4. Return-page polling must display verified deposit details. A success URL alone must not mark a booking as paid.
5. Test cancellation, request retries, an unavailable service, and an unpaid low-priced/consultation booking request. Requests must have status `requested`, amount zero and no Stripe session.
6. Resend the same webhook: the record must not duplicate. Verify a forged/stale signature is rejected. A webhook arriving before the session is attached returns 503 so Stripe can retry it.
7. After completing test verification, configure live-mode keys and a live webhook separately, redeploy as needed, and verify a real transaction and its resulting booking before advertising payment readiness.

The backend selects the deposit amount and service eligibility, records policy acceptance, sends a stable Stripe idempotency key and validates signed events, currency, paid amount and booking metadata. It never stores card details and does not save a card for later cancellation charges. Additional fees must be handled separately with the customer. Expired/abandoned checkout records can remain pending; they are not paid appointments.

**Scheduling:** the original project has no live availability calendar or automatic slot reservation. Customers provide a preferred Ohio date/time; deposit verification and final availability confirmation are distinct. Admin changes do not send email, issue refunds or charge cancellation fees. Use Stripe’s dashboard for refunds and contact the customer to agree changes.

## 5. ImageKit (optional)

Configure public key, URL endpoint and `/timadashouse/beauty` folder in the frontend, and `IMAGEKIT_PRIVATE_KEY` on Convex. Upload authorization now uses an authenticated Convex action and requires a server-owned studio grant. The old anonymous `/imagekit-auth` signer returns 403. Bundled images work without ImageKit.

## 6. Vercel and official domain

1. Deploy the project root to Vercel using the Vite preset. Build command: `npm run build`; output directory: `dist`. Use Node 24 or a supported Node version meeting the package requirement.
2. Add your production `VITE_CONVEX_URL` and optional ImageKit public values to Vercel. Never add private keys with a `VITE_` prefix. The build refuses obvious public-secret variable names.
3. Deploy the backend to the matching production Convex project, configure production server variables and seed that project explicitly.
4. Add `www.timadashouseglam.com` and `timadashouseglam.com` in Vercel’s domain settings. Apply the DNS records Vercel actually provides and verify HTTPS; this source change does not configure DNS.
5. Test `/`, `/appointment`, `/training`, `/policies`, `/pmu-care` and `/admin` by opening each URL directly. Verify the apex redirect, policy disclosures, mobile navigation, logo, footer Lamar link and stock behavior.
6. Submit a training inquiry and unpaid booking request, and complete a Stripe test booking. Verify all three in the correct admin section. No automated training or appointment email/reminder service is configured.

## Verification and limits

See `VERIFICATION.md` for local results. No live seed, Stripe account configuration, live charge, DNS update or published deployment has been verified. The ZIP excludes `.env.local`, Git history, node_modules and macOS metadata. Retained historical source/tests belong to the earlier Calary-derived implementation; `npm test` runs the current Timadashouse suite under `tests/`. Old handoff documents are retained under `docs/legacy` for reference, not current deployment instructions.

## Verbatim policy revision

The published policy text now follows the supplied photographs verbatim. The prior Calary policy module and adapted policy copy have been replaced. PMU preparation/FAQ content is transcribed as selectable page text without paraphrasing. Original business names and apparent errors have deliberately been retained. The policies mention a card on file and additional charges; the current checkout still collects only the $50 deposit and does not store a card for later fees. The reference documents also contain differing age/touch-up guidance; no text has been silently reconciled. Any future text corrections require owner consent.

## Text-only reference content

All supplied-image embeds, links and public image files have been removed. The kids menu, drinks, policies and five PMU documents are represented as text. Original wording and apparent errors are preserved; no wording corrections are authorized by this revision. Existing studio branding and photography from the original project are retained.

## Audited reference text

This revision includes `docs/REFERENCE-AUDIT.md` and `docs/EXTRACTED-REFERENCE-TEXT.md` covering all 14 supplied images. The kids menu is rendered as a separate text section with the exact source headings and price markers. Existing live service records, if any, are still preserved by the idempotent seeder; review their names and prices in the admin dashboard if seeded from an earlier ZIP. No live database changes were made in this revision.

## If Convex reports “Could not find public function for timada:catalog”

The frontend and connected backend are different versions. In this updated project folder, for local development, run:

```sh
npx convex dev --once
npx convex run seedTimada:run
npm run dev
```

Confirm the frontend VITE_CONVEX_URL points to the deployment that was updated. Seeding is idempotent and preserves edited records. For production, deploy the backend with `npx convex deploy` and configure the frontend with its production deployment URL; use `--prod` for the seed. This hotfix prevents the mismatched backend from crashing the public menu, but it does not deploy the backend or enable payment by itself.

## Adding service images

Use Studio Login → Beauty services → Edit → Service images. Add a main photo and optionally up to eight gallery photos. Use Choose an image to upload or paste an HTTPS image URL; local project image paths are also accepted. Save the service to publish its images. The public beauty and kids menus show the saved photos with a clickable larger viewer. Services without photos remain text-only. Existing source reference images have not been embedded or restored.

Deploy this backend first (`npx convex deploy`) because it adds optional image fields to `timadaServices` and its save mutation; then rebuild/redeploy the Vercel frontend. Existing service records and prices are preserved. Keep your own `.env.local` and Vercel project connection.

For Choose an image to be enabled on the published website, set `VITE_IMAGEKIT_PUBLIC_KEY` and `VITE_IMAGEKIT_URL_ENDPOINT` on Vercel Production, then rebuild. Set `IMAGEKIT_PRIVATE_KEY` only in the matching production Convex deployment. Signed upload authorization requires an authenticated, authorized admin. A successful build does not verify those credentials. Pasted image URLs remain available without ImageKit upload configuration.
