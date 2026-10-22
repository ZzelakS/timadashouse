import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { type Product } from '@/data/products'
import { isConvexConfigured } from '@/lib/convex'

export type CatalogueSource = 'convex' | 'offline'

interface CatalogueValue {
  /** Live products only — what the storefront shows. */
  products: Product[]
  loading: boolean
  source: CatalogueSource
  find: (id: string) => Product | undefined
}

const CatalogueContext = createContext<CatalogueValue | null>(null)

function Provide({
  products,
  loading,
  source,
  children,
}: {
  products: Product[]
  loading: boolean
  source: CatalogueSource
  children: ReactNode
}) {
  const value = useMemo<CatalogueValue>(
    () => ({
      products,
      loading,
      source,
      find: (id) => products.find((product) => product.id === id),
    }),
    [products, loading, source],
  )
  return <CatalogueContext.Provider value={value}>{children}</CatalogueContext.Provider>
}

function ConvexCatalogue({ children }: { children: ReactNode }) {
  // Convex pushes updates — saving in the dashboard changes the shop live
  const result = useQuery(api.products.listPublic) as Product[] | undefined
  // A connected empty catalogue stays empty; deleted starters never reappear.

  return (
    <Provide
      products={result ?? []}
      loading={result === undefined}
      source="convex"
    >
      {children}
    </Provide>
  )
}

export function CatalogueProvider({ children }: { children: ReactNode }) {
  if (!isConvexConfigured) {
    return (
      <Provide products={[]} loading={false} source="offline">
        {children}
      </Provide>
    )
  }
  return <ConvexCatalogue>{children}</ConvexCatalogue>
}

export function useCatalogue(): CatalogueValue {
  const context = useContext(CatalogueContext)
  if (!context) throw new Error('useCatalogue must be used inside CatalogueProvider')
  return context
}
