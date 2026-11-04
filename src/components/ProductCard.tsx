import { useEffect, useState } from 'react'
import { formatPrice, type Product } from '@/data/products'
import { imageUrl } from '@/lib/imagekit'

interface ProductCardProps {
  product: Product
  index: number
  onOpen: (product: Product) => void
  onAdd: (product: Product) => void
}

export function ProductCard({ product, index, onOpen, onAdd }: ProductCardProps) {
  const photos = [product.image, ...(product.images ?? []).map((image) => image.url)].filter(Boolean)
  const photoKey = JSON.stringify(photos)
  const [activePhoto, setActivePhoto] = useState(0)
  useEffect(() => {
    setActivePhoto(0)
    if (photos.length < 2) return
    const timer = window.setInterval(() => setActivePhoto((current) => (current + 1) % photos.length), 3000)
    return () => window.clearInterval(timer)
  }, [photoKey])

  return (
    <article className="timada-product-card" onClick={() => onOpen(product)}>
      <button
        type="button"
        onClick={(event) => { event.stopPropagation(); onOpen(product) }}
        className="timada-product-image-button"
        aria-label={`View ${product.name}`}
      >
        <img
          src={imageUrl(photos[activePhoto] ?? product.image, 900, 1200)}
          alt={`${product.name} — ${product.subtitle}`}
          className="timada-product-image"
          loading={index < 3 ? 'eager' : 'lazy'}
          decoding="async"
        />
      </button>

      <div className="timada-product-meta">
        <h3 className="timada-product-name">
          {product.name}
          <span className="timada-product-tag">{product.tag}</span>
        </h3>
        <p className="timada-product-price">{formatPrice(product.price)}</p>
      </div>

      <p className="timada-product-subtitle">{product.subtitle}</p>

      <div className="timada-product-actions" onClick={(event) => event.stopPropagation()}>
        <button
          type="button"
          className="timada-product-add"
          disabled={product.outOfStock}
          onClick={() => onAdd(product)}
        >
          {product.outOfStock ? 'Out of stock' : 'Add to cart'}
        </button>
      </div>
    </article>
  )
}
