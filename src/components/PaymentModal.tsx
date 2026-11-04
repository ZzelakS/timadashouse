import { PRODUCT_SHIPPING_FEE } from '../../shared/pricing'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { ResolvedLine } from '@/store/cart'
import type { BookingDetails } from '../../shared/checkout'
import { useServices } from '@/store/services'
import { formatPrice } from '@/data/products'
import { startStripeCheckout } from '@/lib/checkout'
import { CustomerFields, readCustomer } from './CustomerFields'
import { Lightbox } from './Lightbox'

interface PaymentModalProps {
  open: boolean
  lines?: ResolvedLine[]
  subtotal: number
  booking?: BookingDetails
  onClose: () => void
  onSuccess: (message: string) => void
}

export function PaymentModal({ open, lines = [], subtotal, booking, onClose }: PaymentModalProps) {
  const { services, extras } = useServices()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const submitting = useRef(false)
  const requestId = useRef('')
  const amount = booking ? 50 : subtotal + PRODUCT_SHIPPING_FEE
  const service = services.find(item => item.id === booking?.serviceId)
  const serviceTotal = booking
    ? (service?.lengths.find(item => item.name === booking.length)?.price || 0) + extras.filter(extra => booking.extras.includes(extra.name)).reduce((sum, extra) => sum + extra.price, 0)
    : 0

  useEffect(() => {
    if (!open) return
    requestId.current = crypto.randomUUID()
    setError('')
    setBusy(false)
    submitting.current = false
  }, [open])

  const submitPayment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting.current || busy) return
    const form = event.currentTarget
    const data = new FormData(form)
    let customer
    try {
      customer = readCustomer(data, !booking)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Check your contact and address details.')
      return
    }
    if (!booking && lines.length === 0) {
      setError('Your cart is empty.')
      return
    }
    submitting.current = true
    setBusy(true)
    setError('')
    const result = await startStripeCheckout({ lines, customer, requestId: requestId.current, booking })
    if (!result.ok || !result.url) {
      setError(result.message)
      setBusy(false)
      submitting.current = false
      return
    }
    // Stripe hosts the payment page. The webhook, not this browser redirect, confirms payment.
    window.location.assign(result.url)
  }

  return (
    <Lightbox open={open} onClose={() => { if (!busy) onClose() }} title={booking ? 'Pay your $50 appointment deposit' : 'Complete your order'}>
      <form onSubmit={submitPayment} className="timada-checkout-form space-y-6">
        <div className="bg-sand/50 p-4 text-sm">
          {booking && <><p className="display mb-3 text-xl">{service?.name} · {booking.length}</p><div className="mb-3 flex justify-between"><span>Service total</span><strong>{formatPrice(serviceTotal)}</strong></div></>}
          {!booking && <><div className="mb-3 flex justify-between"><span>Subtotal</span><strong>{formatPrice(subtotal)}</strong></div><div className="mb-3 flex justify-between"><span>Shipping</span><strong>{formatPrice(PRODUCT_SHIPPING_FEE)}</strong></div></>}
          <div className="flex justify-between"><span>{booking ? 'Required deposit' : 'Full order total'}</span><strong>{formatPrice(amount)}</strong></div>
          {booking ? <p className="mt-3">Your appointment is booked for {booking.date} at {booking.time} (America/New_York) after successful payment. The $50 deposit goes toward your service total.</p> : <p className="mt-3 text-mocha">Your full product order total will be collected securely through Stripe Checkout. A flat $10 shipping fee applies per order.</p>}
          {booking && <div className="mt-3 flex justify-between"><span>Balance at appointment</span><strong>{formatPrice(Math.max(0, serviceTotal - 50))}</strong></div>}
        </div>
        <CustomerFields disabled={busy} collectShipping={!booking} />
        {error && <p role="alert" className="border border-red-900/20 bg-red-50 p-4 text-sm text-red-900">{error}</p>}
        <button className="timada-cart-checkout" type="submit" disabled={busy}>{busy ? 'Opening Stripe Checkout…' : `Continue to Stripe · ${formatPrice(amount)}`}</button>
        <p className="text-center text-xs leading-relaxed text-mocha">Secure payment powered by Stripe. Your payment is confirmed by the studio's secure payment notification, not by the return page alone.</p>
      </form>
    </Lightbox>
  )
}
