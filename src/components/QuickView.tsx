import { formatPrice, type Product } from '@/data/products'
import { Drawer } from './Drawer'
import { ProductGallery } from './ProductGallery'

interface QuickViewProps {
  product: Product | null
  open: boolean
  onClose: () => void
  onAdd: (product: Product) => void
}

export function QuickView({ product, open, onClose, onAdd }: QuickViewProps) {
  const photos = product ? [product.image, ...(product.images ?? []).map((image) => image.url)].filter(Boolean) : []

  return (
    <Drawer
      variant="modal"
      open={open}
      onClose={onClose}
      title={product ? product.name : 'Piece'}
      footer={
        product ? (
          <div className="space-y-4">
            <div className="flex items-baseline justify-between">
              <span className="hud text-mocha">Total</span>
              <span className="font-mono text-sm text-gold">{formatPrice(product.price)}</span>
            </div>
            <button
              type="button"
              className="timada-cart-checkout"
              disabled={product.outOfStock}
              onClick={() => {
                onAdd(product)
                onClose()
              }}
            >
              {product.outOfStock ? 'Out of stock' : 'Add to cart'}
            </button>
            
          </div>
        ) : null
      }
    >
      {product ? (
        <div className="timada-quick-view">
          <ProductGallery photos={photos} name={product.name} open={open} />

          <div className="timada-quick-view-copy">
            
            <h3 className="timada-quick-view-title">
              {product.name}
              <span className="hud ml-3 align-middle text-ink/35">{product.tag}</span>
            </h3>
            <p className="timada-quick-view-subtitle">{product.subtitle}</p>

            <p className="timada-quick-view-detail">{product.detail}</p>

            <dl className="timada-product-specs">
              {product.specs.map((spec) => (
                <div key={spec.label}>
                  <dt>{spec.label}</dt>
                  <dd>{spec.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      ) : null}
    </Drawer>
  )
}
