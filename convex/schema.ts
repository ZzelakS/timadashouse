import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/** Shared between the table definition and the write mutations. */
export const productFields = {
  /** URL-safe id used in links and cart lines. Stable once created. */
  slug: v.string(),
  name: v.string(),
  /** Small label beside the name — length, count, size. */
  tag: v.string(),
  subtitle: v.string(),
  /** Whole US dollars. */
  price: v.number(),
  /** Absolute ImageKit URL, or a path to a file in /public. */
  image: v.string(),
  /** ImageKit file id, kept so the file can be removed with the product. */
  imageFileId: v.optional(v.string()),
  images: v.optional(
    v.array(v.object({ url: v.string(), fileId: v.optional(v.string()) })),
  ),
  category: v.union(v.literal("wigs"), v.literal("beauty")),
  origin: v.string(),
  detail: v.string(),
  specs: v.array(v.object({ label: v.string(), value: v.string() })),
  /** Wigs only — becomes the size picker in the quick view. */
  lengths: v.optional(v.array(v.string())),
  /** Drafts stay out of the storefront but stay in the dashboard. */
  active: v.boolean(),
  outOfStock: v.optional(v.boolean()),
  /** Low numbers sort first. */
  order: v.number(),
  updatedAt: v.number(),
};

export const serviceFields = {
  slug: v.string(),
  name: v.string(),
  category: v.string(),
  rows: v.string(),
  image: v.string(),
  imageFileId: v.optional(v.string()),
  lengths: v.array(v.object({ name: v.string(), price: v.number() })),
  active: v.boolean(),
  order: v.number(),
  updatedAt: v.number(),
};
export default defineSchema({
  trainingRegistrations: defineTable({
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    course: v.string(),
    experience: v.string(),
    message: v.string(),
    status: v.union(
      v.literal("new"),
      v.literal("contacted"),
      v.literal("enrolled"),
      v.literal("closed"),
    ),
    consentAt: v.number(),
    createdAt: v.number(),
  }).index("by_email", ["email"]),
  timadaServices: defineTable({
    slug: v.string(),
    category: v.string(),
    name: v.string(),
    price: v.union(v.number(), v.null()),
    duration: v.string(),
    description: v.string(),
    image: v.optional(v.string()),
    imageFileId: v.optional(v.string()),
    images: v.optional(
      v.array(v.object({ url: v.string(), fileId: v.optional(v.string()) })),
    ),
    active: v.boolean(),
    outOfStock: v.optional(v.boolean()),
  }).index("by_slug", ["slug"]),
  timadaBookings: defineTable({
    requestId: v.optional(v.string()),
    servicePrice: v.optional(v.number()),
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    serviceSlug: v.string(),
    serviceName: v.string(),
    date: v.string(),
    time: v.string(),
    notes: v.string(),
    amountCents: v.number(),
    stripeSessionId: v.optional(v.string()),
    stripePaymentIntent: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("requested"),
      v.literal("confirmed"),
      v.literal("cancelled"),
      v.literal("completed"),
    ),
    policyVersion: v.optional(v.string()),
    policyAcceptedAt: v.optional(v.number()),
    studioNotes: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_requestId", ["requestId"])
    .index("by_session", ["stripeSessionId"])
    .index("by_status", ["status"]),

  services: defineTable(serviceFields)
    .index("by_slug", ["slug"])
    .index("by_active", ["active"]),
  serviceSettings: defineTable({
    key: v.string(),
    extras: v.array(v.object({ name: v.string(), price: v.number() })),
    updatedAt: v.number(),
  }).index("by_key", ["key"]),
  // users, authSessions, authAccounts and friends, from @convex-dev/auth
  ...authTables,
  adminGrants: defineTable({
    userId: v.id("users"),
    grantedAt: v.number(),
  }).index("by_userId", ["userId"]),

  paymentRecords: defineTable({
    requestId: v.string(),
    payload: v.string(),
    kind: v.union(v.literal("order"), v.literal("booking")),
    amount: v.number(),
    status: v.union(
      v.literal("processing"),
      v.literal("paid"),
      v.literal("declined"),
      v.literal("unknown"),
    ),
    appointmentStatus: v.optional(
      v.union(
        v.literal("confirmed"),
        v.literal("completed"),
        v.literal("cancelled"),
      ),
    ),
    appointmentDate: v.optional(v.string()),
    appointmentTime: v.optional(v.string()),
    studioNotes: v.optional(v.string()),
    transactionId: v.optional(v.string()),
    walletState: v.optional(v.string()),
    paypalReference: v.optional(v.string()),
    walletClaimed: v.optional(v.boolean()),
    updatedAt: v.number(),
  })
    .index("by_requestId", ["requestId"])
    .index("by_kind_status", ["kind", "status"]),

  products: defineTable(productFields)
    .index("by_slug", ["slug"])
    .index("by_active", ["active"]),
});
