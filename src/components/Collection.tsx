import { useMemo, useState } from 'react'
import type { Category, Product } from '@/data/products'
import { useCatalogue } from '@/store/catalogue'
import { useReveal } from '@/hooks/useReveal'
import { ProductCard } from './ProductCard'

type Filter = 'all' | Category

const filters: { id: Filter; label: string }[] = [
  { id: 'wigs', label: 'Wigs' },
  { id: 'beauty', label: 'Beauty' },
  { id: 'all', label: 'Everything' },
]

interface CollectionProps {
  onOpen: (product: Product) => void
  onAdd: (product: Product) => void
}

export function Collection({ onOpen, onAdd }: CollectionProps) {
  const [filter, setFilter] = useState<Filter>('wigs')
  const { ref, shown } = useReveal<HTMLDivElement>()
  const { products, loading } = useCatalogue()

  const visible = useMemo(
    () => {
      if (filter !== 'all') {
        return products.filter((item) => item.category === filter)
      }
      return [
        ...products.filter((item) => item.category === 'wigs'),
        ...products.filter((item) => item.category !== 'wigs'),
      ]
    },
    [filter, products],
  )

  return (
    <section id="collection" className="timada-shop-collection">
      <div ref={ref} className="timada-shop-intro reveal" data-shown={shown}>
        <div className="timada-shop-heading">
          <div>
            <p className="eyebrow">THE COLLECTION</p>
            <h2>
              A considered collection.
              <br />
              Made to be lived in.
            </h2>
          </div>
          <div className="timada-shop-filters" role="tablist" aria-label="Filter collection">
            {filters.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={filter === item.id}
                onClick={() => setFilter(item.id)}
                className="timada-shop-filter"
                data-active={filter === item.id}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {!loading && !visible.length ? (
        <p className="timada-shop-empty">
          Nothing in this part of the shop yet — check back shortly.
        </p>
      ) : null}

      <div className="timada-shop-grid">
        {visible.map((product, index) => (
          <ProductCard
            key={product.id}
            product={product}
            index={index}
            onOpen={onOpen}
            onAdd={onAdd}
          />
        ))}
      </div>
    </section>
  )
}
