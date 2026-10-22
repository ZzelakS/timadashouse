import { httpRouter } from 'convex/server'
import { checkout, verify, webhook, options } from './timadaStripe'
import { auth } from './auth'
import {
  auth as imagekitAuth,
  authPreflight,
} from './imagekit'
const http = httpRouter()

// /api/auth/* — sign in, sign out, token refresh
auth.addHttpRoutes(http)

// https://<deployment>.convex.site/imagekit-auth
http.route({
  path: '/imagekit-auth',
  method: 'GET',
  handler: imagekitAuth,
})

http.route({
  path: '/imagekit-auth',
  method: 'OPTIONS',
  handler: authPreflight,
})

http.route({path:'/timada-checkout',method:'POST',handler:checkout})
http.route({path:'/timada-checkout',method:'OPTIONS',handler:options})
http.route({path:'/timada-verify',method:'GET',handler:verify})
http.route({path:'/timada-stripe-webhook',method:'POST',handler:webhook})
export default http