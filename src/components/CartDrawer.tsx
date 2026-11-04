import { PRODUCT_SHIPPING_FEE } from '../../shared/pricing'
import { useState } from 'react'
import { formatPrice } from '@/data/products'
import { imageUrl } from '@/lib/imagekit'
import { useCart } from '@/store/cart'
import { Drawer } from './Drawer'
import { PaymentModal } from './PaymentModal'

interface CartDrawerProps {
  open: boolean
  onClose: () => void
  onNotice: (message: string) => void
}

export function CartDrawer({
  open,
  onClose,
  onNotice,
}: CartDrawerProps) {
  const {
    lines,
    subtotal,
    setQuantity,
    remove,
    clear,
  } = useCart()

  const [paymentOpen, setPaymentOpen] = useState(false)

  const checkout = () => {
    if (!lines.length) {
      onNotice('Your bag is empty.')
      return
    }

    setPaymentOpen(true)
  }

  const handlePaymentSuccess = (message: string) => {
    clear()
    setPaymentOpen(false)
    onClose()
    onNotice(message)
  }

  return (
    <>
      <Drawer
        open={open && !paymentOpen}
        onClose={onClose}
        title="Your bag"
        footer={
          lines.length ? (
            <div className="timada-cart-summary">
              <div className="timada-cart-total-row">
                <span className="timada-cart-label">Subtotal</span>
                <span className="timada-cart-price">
                  {formatPrice(subtotal)}
                </span>
              </div>

              <div className="timada-cart-total-row">
                <span className="timada-cart-label">Shipping</span>
                <span className="timada-cart-price">{formatPrice(PRODUCT_SHIPPING_FEE)}</span>
              </div>
              <div className="timada-cart-total-row">
                <span className="timada-cart-label">Order total</span>
                <strong className="timada-cart-price">{formatPrice(subtotal + PRODUCT_SHIPPING_FEE)}</strong>
              </div>
              <p className="timada-cart-note">A flat $10 shipping fee applies per order.</p>

              <button type="button" className="timada-cart-checkout" onClick={checkout}>
                Go to checkout
              </button>
            </div>
          ) : null
        }
      >
        {lines.length === 0 ? (
          <div className="timada-cart-empty">
            <p className="timada-cart-empty-title">
              Nothing in here yet.
            </p>

            <p className="timada-cart-empty-copy">
              Explore the collection and add your favourites here.
            </p>

            <div className="timada-cart-empty-action">
              <button
                type="button"
                className="timada-cart-secondary"
                onClick={() => {
                  onClose()
                  document.getElementById('collection')?.scrollIntoView({ behavior: 'smooth' })
                }}
              >
                Open the collection
              </button>
            </div>
          </div>
        ) : (
          <ul>
            {lines.map((line) => (
              <li
                key={line.key}
                className="timada-cart-line"
              >
                <img
                  src={imageUrl(line.product.image, 200, 240)}
                  alt=""
                  className="timada-cart-image"
                  loading="lazy"
                />

                <div className="timada-cart-line-copy">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="timada-cart-product-name">
                      {line.product.name}
                    </h3>

                    <span className="font-mono text-xs text-gold">
                      {formatPrice(line.lineTotal)}
                    </span>
                  </div>

                  <p className="timada-cart-product-meta">
                    {line.product.subtitle}
                    {line.length ? ` · ${line.length}` : ''}
                  </p>

                  <div className="timada-cart-line-controls">
                    <div className="timada-cart-quantity">
                      <button
                        type="button"
                        onClick={() =>
                          setQuantity(
                            line.key,
                            line.quantity - 1,
                          )
                        }
                        className="timada-cart-quantity-button"
                        aria-label={`Remove one ${line.product.name}`}
                      >
                        −
                      </button>

                      <span className="timada-cart-quantity-value">
                        {line.quantity}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          setQuantity(
                            line.key,
                            line.quantity + 1,
                          )
                        }
                        className="timada-cart-quantity-button"
                        aria-label={`Add one ${line.product.name}`}
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => remove(line.key)}
                      className="timada-cart-remove"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Drawer>

      <PaymentModal
        open={paymentOpen}
        lines={lines}
        subtotal={subtotal}
        onClose={() => setPaymentOpen(false)}
        onSuccess={handlePaymentSuccess}
      />
    </>
  )
}