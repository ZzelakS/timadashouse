// Advisory only: optional integrations must not be required to compile the storefront.
// Never log server-side credentials or treat missing credentials as a successful integration.
import { readFileSync, existsSync } from 'node:fs'
const env = {}
for (const name of ['.env', '.env.local', '.env.production']) {
  if (!existsSync(name)) continue
  for (const line of readFileSync(name, 'utf8').split(/\r?\n/)) {
    const match = /^\s*(VITE_[A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line)
    if (match) env[match[1]] = match[2].replace(/^['"]|['"]$/g, '').trim()
  }
}
Object.assign(env, Object.fromEntries(Object.entries(process.env).filter(([key]) => key.startsWith('VITE_'))))
for (const key of Object.keys(env)) {
 if (/^VITE_.*(SECRET|PRIVATE|ENROLLMENT|TRANSACTION_KEY|API_LOGIN)/i.test(key) && env[key]) {
  console.error('[config] Refusing build: a server credential has a public VITE_ prefix.'); process.exit(1)
 }
}
const convexUrl = env.VITE_CONVEX_URL
if (!convexUrl || !/^https:\/\/[a-z0-9-]+\.convex\.cloud\/?$/.test(convexUrl)) {
  console.warn('[config] Convex URL is missing/invalid. Storefront uses bundled service data; live bookings and admin functions require Convex.')
}
if (!env.VITE_IMAGEKIT_PUBLIC_KEY || !/^https:\/\//.test(env.VITE_IMAGEKIT_URL_ENDPOINT || '')) {
  console.warn('[config] ImageKit public settings incomplete. Existing local images work; admin uploads will be unavailable.')
}
console.info('[config] Validation complete. Payment keys and the ImageKit private key are configured server-side, not checked here.')
