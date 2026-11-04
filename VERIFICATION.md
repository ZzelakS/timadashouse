# Verification — text-only reference revision

- `npm test`: 24 tests passed.
- `npm run build`: passed, including frontend and Convex backend TypeScript checks.
- PMU care and the six policies render as selectable text. Rendering tests verify no supplied-image embeds or image links.
- Kids menu and drinks are text. Supplied reference images have been removed from public assets, production assets and the updated ZIP. Original project studio branding and photography remain.
- Original supplied wording, names and apparent errors are preserved. The policy acceptance version identifies the verbatim revision.
- Prior server authorization, fixed-deposit checkout, webhook, catalogue, request and training tests still pass. Stripe responses and database operations are tested locally; this does not verify live integration readiness.

Browser visual inspection, live account enrollment, live seeding, Stripe account/webhook readiness, ImageKit uploads, DNS and published deployment remain unverified. No automatic email service or availability calendar is included. Production environment configuration and a rebuild are still required; see DEPLOYMENT.md.

The retained Tailwind 3 development toolchain has 7 reported transitive development advisories (5 high, 2 moderate). The last production-only dependency audit reported zero vulnerabilities. Development tooling should remain local.

## Fourteen-image content check

All 14 originals were visually reviewed. See `docs/REFERENCE-AUDIT.md` for the per-image mapping and review scope, and `docs/EXTRACTED-REFERENCE-TEXT.md` for the extracted content record. The kids menu now preserves all source headings, 21 names and exact price markers. Corrected one extra word in the prior PMU FAQ transcription. Rendering checks cover the full kids menu and absence of supplied-image embeds/links. Production build and frontend/backend type checks passed after these corrections.

## Services menu restoration and drinks styling

Restored original beauty category navigation immediately below the service-menu heading. The 60 original beauty services render before the 21 kids services; all 81 Book links are checked in the rendered homepage test. Header Services and the hero services link target the actual catalogue. Added an explicit unseeded-catalogue fallback; an initialized catalogue that is hidden or deleted remains empty. Drinks now use the existing cream, brown and gold palette and serif heading style, with its supplied wording retained. All 16 tests and the production build passed. Visual browser verification is still not claimed.

## Missing backend function hotfix

The catalogue subscription now catches query errors, including a backend that does not yet expose `timada:catalog`. The public menu remains visible as a reference without throwing through React. Online booking is paused until an initialized live catalogue is confirmed. Live updates resume automatically; an intentionally empty live catalogue is never replaced by starter services after an error. Added four subscription/error-handling regression tests. All 20 tests and the production build pass. No remote backend deployment was performed.

## Admin login without enrollment codes

The public login form uses only email and password. Public signup/reset flows are disabled server-side. The internal `adminAccounts:provision` action lets the deployment owner create only the two approved studio accounts, using Convex Auth’s password hashing and a server-owned admin grant. Added a test covering private provisioning, hashed password storage, authorized dashboard access, disallowed emails, short passwords and wrong-password rejection. All 21 tests and the production build passed. No accounts have been created on the user’s actual deployments by this work.

## Service image editing and public display

The service editor now supports a main image and up to eight gallery images, through the existing ImageKit upload component or pasted image URLs. Uploaded URLs and file IDs persist in optional Convex fields. Public beauty and kids services show clickable thumbnails using the existing full-size viewer. Saving is disabled while uploads are in progress. Existing services remain valid, seeds preserve image edits, older edits that omit image fields preserve stored images, and explicit clearing removes service image references. Removing a service image does not delete the underlying shared ImageKit library file. Backend checks reject unsafe URL schemes, excessive galleries and unauthorized writes. All 24 tests and the production build passed. Actual live ImageKit credential/upload behavior has not been verified. The fourteen supplied policy/menu/PMU reference images remain excluded.
