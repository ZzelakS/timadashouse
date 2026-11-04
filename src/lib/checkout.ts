import type { ResolvedLine } from '@/store/cart'
import { convexSiteUrl } from '@/lib/convex'
import type { BookingDetails, CustomerDetails } from '../../shared/checkout'

export interface CheckoutResult { ok: boolean; message: string; url?: string; transactionId?: string; retryable?: boolean }

export async function startStripeCheckout(input: {
  lines?: ResolvedLine[]
  customer: CustomerDetails
  requestId: string
  booking?: BookingDetails
}): Promise<CheckoutResult> {
  const siteUrl = convexSiteUrl()
  if (!siteUrl) return { ok: false, message: 'Payment service is not configured. Please contact the studio.' }
  const isBooking = Boolean(input.booking)
  const endpoint = isBooking ? '/timada-checkout' : '/timada-product-checkout'
  const body = isBooking
    ? {
        requestId: input.requestId,
        name: `${input.customer.billing.firstName} ${input.customer.billing.lastName}`.trim(),
        email: input.customer.email,
        phone: input.customer.phone,
        serviceSlug: input.booking!.serviceId,
        date: input.booking!.date,
        time: input.booking!.time,
        notes: input.booking!.notes,
        policyAccepted: input.booking!.policyAccepted,
      }
    : {
        requestId: input.requestId,
        customer: input.customer,
        items: (input.lines ?? []).map(line => ({ productId: line.product.id, length: line.length, quantity: line.quantity })),
      }
  try {
    const response = await fetch(`${siteUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const result = await response.json() as { url?: string; error?: string }
    if (!response.ok || !result.url || !result.url.startsWith('https://checkout.stripe.com/')) {
      return { ok: false, message: result.error || 'Unable to start secure Stripe Checkout. Please try again.' }
    }
    return { ok: true, message: 'Redirecting to secure Stripe Checkout.', url: result.url }
  } catch {
    return { ok: false, message: 'We could not connect to secure checkout. Please try again.' }
  }
}

/** @deprecated Legacy wallet adapter retained for source compatibility; storefront checkout now uses Stripe-hosted Checkout. */
export async function startCheckout(
  _lines: ResolvedLine[],
  _customer: CustomerDetails,
  _payment: { dataDescriptor: string; dataValue: string },
  _requestId: string,
  _booking?: BookingDetails,
): Promise<CheckoutResult & { transactionId?: string; retryable?: boolean }> {
  return { ok: false, message: 'This payment method is no longer available. Please use Stripe Checkout.' }
}
