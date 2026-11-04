# Configuration failsafes

`npm run build` runs `scripts/check-config.mjs` before TypeScript and Vite. Missing/incomplete optional environment configuration emits **warnings**, not build errors. Genuine TypeScript and bundler errors still fail the build.

- **Convex**: missing/invalid `VITE_CONVEX_URL` does not construct a Convex client. The public storefront falls back to the bundled service catalog; booking, persistence, and admin features need a working Convex deployment. This failsafe does **not** cover an unreachable but syntactically valid deployment; handle runtime request errors normally.
- **ImageKit**: missing public key / endpoint disables admin uploads with a readable error. Local photography and preexisting image URLs remain usable. Private `IMAGEKIT_PRIVATE_KEY` goes in Convex environment variables, never a `VITE_` setting.
- **Stripe**: missing server-side `STRIPE_SECRET_KEY` returns a 503 from checkout, with no appointment confirmation. The webhook requires `STRIPE_WEBHOOK_SECRET`; booking must not be confirmed until verified. Keep Stripe secrets in Convex, not Vercel client variables.
- **Build**: `npm run typecheck` and `npm run build` must still pass before deployment. Do not use `|| true` to bypass TypeScript or Convex API errors. When functions change, regenerate the checked-in Convex declarations with `npx convex dev --once` while the **correct** project is selected.

Run `npm run check:config` to see warnings without building. Check actual backend connectivity separately; a passing frontend build is not proof that payment/upload/booking integrations are ready.
