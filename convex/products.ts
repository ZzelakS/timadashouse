import { isStudioEmail } from '../shared/adminPolicy'
import { getAuthUserId } from '@convex-dev/auth/server'
import { v } from 'convex/values'
import { productError } from '../shared/productErrors'
import type { Doc } from './_generated/dataModel'
import { mutation, query, type MutationCtx, type QueryCtx } from './_generated/server'
import { internal } from './_generated/api'
import { productFields } from './schema'

/** The shape the client works with — `_id` and `_creationTime` stay in Convex. */
function toProduct(doc: Doc<'products'>) {
  return {
    id: doc.slug,
    name: doc.name,
    tag: doc.tag,
    subtitle: doc.subtitle,
    price: doc.price,
    image: doc.image,
    imageFileId: doc.imageFileId,
    images: doc.images ?? [],
    category: doc.category,
    origin: doc.origin,
    detail: doc.detail,
    specs: doc.specs,
    lengths: doc.lengths,
    active: doc.active,
    outOfStock: doc.outOfStock ?? false,
    order: doc.order,
    updatedAt: doc.updatedAt,
  }
}

function byOrder(a: { order: number; name: string }, b: { order: number; name: string }) {
  return a.order - b.order || a.name.localeCompare(b.name)
}

/**
 * Who is allowed to write.
 *
 * The allowlist lives in a Convex environment variable rather than the client
 * bundle, so it cannot be edited from a browser:
 *
 *   npx convex env set ADMIN_EMAILS "you@calarybeauty.com,studio@calarybeauty.com"
 */
export async function requireAdmin(ctx: MutationCtx | QueryCtx): Promise<Doc<'users'>> {
  const userId = await getAuthUserId(ctx)
  if (!userId) productError('SIGN_IN_REQUIRED', 'Your sign-in has expired. Sign in again, then save the product.')

  const user = await ctx.db.get(userId)
  if (!user) productError('ACCOUNT_MISSING', 'This account is no longer available. Sign in with an active studio account.')

  const grant = await ctx.db.query('adminGrants').withIndex('by_userId', q => q.eq('userId', userId)).unique()
  if (!user.email || !isStudioEmail(user.email, process.env.ADMIN_EMAILS) || !grant) {
    productError('ADMIN_NOT_ALLOWED', 'This account has no studio authorization. Contact the deployment administrator.')
  }
  return user
}

/** Storefront: live products only. Public on purpose. */
export const listPublic = query({
  args: {},
  handler: async (ctx: QueryCtx) => {
    const docs = await ctx.db
      .query('products')
      .withIndex('by_active', (q) => q.eq('active', true))
      .collect()
    return docs.map(toProduct).sort(byOrder)
  },
})

/** Dashboard: everything, drafts included. */
export const listAll = query({
  args: {},
  handler: async (ctx: QueryCtx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return []
    await requireAdmin(ctx)
    const docs = await ctx.db.query('products').collect()
    return docs.map(toProduct).sort(byOrder)
  },
})

/** Whether the signed-in account may write. Drives the dashboard UI. */
export const viewer = query({
  args: {},
  handler: async (ctx: QueryCtx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return null

    const user = await ctx.db.get(userId)
    const grant = await ctx.db.query('adminGrants').withIndex('by_userId', q => q.eq('userId', userId)).unique()
    return {
      email: user?.email ?? null,
      isAdmin: Boolean(user?.email && isStudioEmail(user.email, process.env.ADMIN_EMAILS) && grant),
      allowlistConfigured: true,
    }
  },
})

const writeArgs = {
  slug: productFields.slug,
  name: productFields.name,
  tag: productFields.tag,
  subtitle: productFields.subtitle,
  price: productFields.price,
  image: productFields.image,
  imageFileId: productFields.imageFileId,
  images: productFields.images,
  category: productFields.category,
  origin: productFields.origin,
  detail: productFields.detail,
  specs: productFields.specs,
  lengths: productFields.lengths,
  active: productFields.active,
  outOfStock: productFields.outOfStock,
  order: productFields.order,
}

/** Create or update, keyed on slug. */
export const save = mutation({
  args: writeArgs,
  handler: async (ctx, args) => {
    await requireAdmin(ctx)

    const existing = await ctx.db
      .query('products')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .unique()

    if (!args.name.trim()) productError('NAME_REQUIRED', 'Enter the product name before saving.')
    if (!args.subtitle.trim()) productError('SUBTITLE_REQUIRED', 'Enter a short description before saving.')
    if (!Number.isFinite(args.price) || args.price <= 0) productError('PRICE_INVALID', 'Enter a product price greater than $0.')
    if (!Number.isFinite(args.order)) productError('ORDER_INVALID', 'Enter a valid number for the display order.')
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(args.slug)) productError('ID_INVALID', 'The product link must use lowercase letters, numbers and single hyphens.')
    const images = args.images ?? existing?.images ?? []
    if (!args.image.trim() || images.some((image) => !image.url.trim())) {
      productError('IMAGE_REQUIRED', 'Add the main product image and complete or remove any empty extra photos before saving.')
    }
    const document = { ...args, images, updatedAt: Date.now() }

    if (existing) {
      const retained = new Set([args.imageFileId, ...images.map((image) => image.fileId)])
      const previous = new Set([existing.imageFileId, ...(existing.images ?? []).map((image) => image.fileId)])
      for (const fileId of previous) {
        if (fileId && !retained.has(fileId)) {
          await ctx.scheduler.runAfter(0, internal.imagekit.deleteFile, { fileId })
        }
      }
      await ctx.db.patch(existing._id, document)
      return existing.slug
    }

    await ctx.db.insert('products', document)
    return args.slug
  },
})

export const remove = mutation({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    await requireAdmin(ctx)

    const existing = await ctx.db
      .query('products')
      .withIndex('by_slug', (q) => q.eq('slug', slug))
      .unique()
    if (!existing) return false

    await ctx.db.delete(existing._id)
    const files = new Set([existing.imageFileId, ...(existing.images ?? []).map((image) => image.fileId)])
    for (const fileId of files) {
      if (fileId) await ctx.scheduler.runAfter(0, internal.imagekit.deleteFile, { fileId })
    }
    return true
  },
})

/** Writes the catalogue bundled with the build. Skips slugs that already exist. */
export const seedMany = mutation({
  args: { products: v.array(v.object(writeArgs)) },
  handler: async (ctx, { products }) => {
    await requireAdmin(ctx)

    let written = 0
    for (const product of products) {
      const existing = await ctx.db
        .query('products')
        .withIndex('by_slug', (q) => q.eq('slug', product.slug))
        .unique()
      if (existing) continue
      await ctx.db.insert('products', { ...product, updatedAt: Date.now() })
      written += 1
    }
    return written
  },
})
