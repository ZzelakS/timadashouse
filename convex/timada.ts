import { timadaServices as starterServices } from "../shared/timadaCatalog";
import {
  markCatalogueInitialized,
  catalogueStateKey,
} from "./timadaCatalogState";
import { validateAppointment, POLICY_VERSION } from "../shared/timadaBooking";
import { v } from "convex/values";
import {
  mutation,
  query,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { requireAdmin } from "./products";
export const listServices = query({
  args: {},
  handler: async (ctx) =>
    (await ctx.db.query("timadaServices").collect()).filter((s) => s.active),
});
/** Bundled menu is shown only before the first live catalogue initialization. */
export const catalog = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("timadaServices").collect();
    const state = await ctx.db
      .query("serviceSettings")
      .withIndex("by_key", (q) => q.eq("key", catalogueStateKey))
      .unique();
    const initialized = !!state || rows.length > 0;
    return {
      initialized,
      services: initialized
        ? rows.filter((s) => s.active)
        : starterServices.map((s) => ({
            ...s,
            active: true,
            outOfStock: false,
          })),
    };
  },
});
export const seed = mutation({
  args: {
    services: v.array(
      v.object({
        slug: v.string(),
        category: v.string(),
        name: v.string(),
        price: v.union(v.number(), v.null()),
        duration: v.string(),
        description: v.string(),
      }),
    ),
  },
  handler: async (ctx, { services }) => {
    await requireAdmin(ctx);
    await markCatalogueInitialized(ctx);
    let added = 0;
    for (const service of services) {
      const found = await ctx.db
        .query("timadaServices")
        .withIndex("by_slug", (q) => q.eq("slug", service.slug))
        .unique();
      if (!found) {
        await ctx.db.insert("timadaServices", { ...service, active: true });
        added++;
      }
    }
    return { added, total: services.length };
  },
});
export const listBookings = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return ctx.db.query("timadaBookings").order("desc").take(300);
  },
});
export const createPending = internalMutation({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    serviceSlug: v.string(),
    date: v.string(),
    time: v.string(),
    notes: v.string(),
    policyAccepted: v.boolean(),
    requestId: v.string(),
  },
  handler: async (ctx, input) => {
    const { policyAccepted: _, ...a } = validateAppointment(input);
    if (!/^[a-f0-9-]{36}$/.test(input.requestId))
      throw Error("Invalid booking request");
    const prior = await ctx.db
      .query("timadaBookings")
      .withIndex("by_requestId", (q) => q.eq("requestId", input.requestId))
      .unique();
    if (prior) {
      if (
        prior.email !== a.email ||
        prior.serviceSlug !== a.serviceSlug ||
        prior.date !== a.date ||
        prior.time !== a.time ||
        prior.name !== a.name ||
        prior.phone !== a.phone ||
        prior.notes !== a.notes
      )
        throw Error("Request details changed; reload and try again");
      return { id: prior._id, serviceName: prior.serviceName };
    }
    const service = await ctx.db
      .query("timadaServices")
      .withIndex("by_slug", (q) => q.eq("slug", a.serviceSlug))
      .unique();
    if (
      !service ||
      !service.active ||
      service.outOfStock ||
      service.price === null ||
      service.price < 50
    )
      throw Error("Service not eligible for online deposit");
    const id = await ctx.db.insert("timadaBookings", {
      ...a,
      requestId: input.requestId,
      servicePrice: service.price,
      serviceName: service.name,
      amountCents: 5000,
      status: "pending",
      createdAt: Date.now(),
      policyVersion: POLICY_VERSION,
      policyAcceptedAt: Date.now(),
    });
    return { id, serviceName: service.name };
  },
});
export const attachSession = internalMutation({
  args: { id: v.id("timadaBookings"), sessionId: v.string() },
  handler: async (ctx, a) => {
    const existing = await ctx.db.get(a.id);
    if (!existing || existing.status !== "pending")
      throw Error("Invalid booking");
    await ctx.db.patch(a.id, { stripeSessionId: a.sessionId });
  },
});
export const getBySession = internalQuery({
  args: { sessionId: v.string() },
  handler: async (ctx, a) =>
    ctx.db
      .query("timadaBookings")
      .withIndex("by_session", (q) => q.eq("stripeSessionId", a.sessionId))
      .unique(),
});
export const confirm = internalMutation({
  args: { sessionId: v.string(), paymentIntent: v.optional(v.string()) },
  handler: async (ctx, a) => {
    const existing = await ctx.db
      .query("timadaBookings")
      .withIndex("by_session", (q) => q.eq("stripeSessionId", a.sessionId))
      .unique();
    if (!existing) return false;
    if (
      existing.status === "confirmed" ||
      existing.status === "completed" ||
      existing.status === "cancelled"
    )
      return true;
    if (existing.status !== "pending") return false;
    await ctx.db.patch(existing._id, {
      status: "confirmed",
      stripePaymentIntent: a.paymentIntent,
    });
    return true;
  },
});

export const allServices = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return ctx.db.query("timadaServices").collect();
  },
});
export const saveService = mutation({
  args: {
    slug: v.string(),
    name: v.string(),
    category: v.string(),
    price: v.union(v.number(), v.null()),
    duration: v.string(),
    description: v.string(),
    image: v.optional(v.string()),
    imageFileId: v.optional(v.string()),
    images: v.optional(
      v.array(v.object({ url: v.string(), fileId: v.optional(v.string()) })),
    ),
    active: v.boolean(),
    outOfStock: v.boolean(),
    creating: v.boolean(),
  },
  handler: async (ctx, { creating, ...s }) => {
    await requireAdmin(ctx);
    await markCatalogueInitialized(ctx);
    if (
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s.slug) ||
      !s.name.trim() ||
      !s.category.trim() ||
      s.name.length > 120 ||
      s.description.length > 2000 ||
      (s.price !== null && (!Number.isFinite(s.price) || s.price < 0))
    )
      throw Error("Enter a valid name, category, slug and price");
    const existing = await ctx.db
      .query("timadaServices")
      .withIndex("by_slug", (q) => q.eq("slug", s.slug))
      .unique();
    if (creating && existing) throw Error("This service link already exists");
    if (!creating && !existing) throw Error("Service no longer exists; reload");
    const validImage = (url: string) =>
      url.length <= 2048 &&
      (url === "" || /^https:\/\//i.test(url) || /^\/(?!\/)/.test(url));
    if (
      (s.image !== undefined && !validImage(s.image)) ||
      (s.images &&
        (s.images.length > 8 ||
          s.images.some(
            (photo) => !photo.url.trim() || !validImage(photo.url),
          )))
    )
      throw Error(
        "Use HTTPS or local image URLs, with at most 8 gallery photos",
      );
    const image = s.image === undefined ? existing?.image : s.image.trim();
    const imageFileId =
      s.image === undefined ? existing?.imageFileId : s.imageFileId;
    const images =
      s.images === undefined
        ? (existing?.images ?? [])
        : s.images.map((photo) => ({ ...photo, url: photo.url.trim() }));
    const data = { ...s, image, imageFileId, images };
    if (existing) await ctx.db.patch(existing._id, data);
    else await ctx.db.insert("timadaServices", data);
    return s.slug;
  },
});
export const removeService = mutation({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    await requireAdmin(ctx);
    await markCatalogueInitialized(ctx);
    const row = await ctx.db
      .query("timadaServices")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
    if (row) await ctx.db.delete(row._id);
    return null;
  },
});
export const updateBooking = mutation({
  args: {
    id: v.id("timadaBookings"),
    date: v.string(),
    time: v.string(),
    status: v.union(
      v.literal("confirmed"),
      v.literal("completed"),
      v.literal("cancelled"),
    ),
    studioNotes: v.string(),
  },
  handler: async (ctx, a) => {
    await requireAdmin(ctx);
    const row = await ctx.db.get(a.id);
    if (!row || row.status === "pending" || row.status === "requested")
      throw Error("Only paid appointments can be edited");
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(a.date) ||
      !Number.isFinite(Date.parse(a.date)) ||
      new Date(a.date).toISOString().slice(0, 10) !== a.date ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(a.time) ||
      a.studioNotes.length > 2000
    )
      throw Error("Invalid appointment details");
    const { id, ...changes } = a;
    await ctx.db.patch(id, changes);
    return null;
  },
});

/** Public booking requests for consultation/add-on/low-priced services; never a paid confirmation. */
export const requestBooking = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    serviceSlug: v.string(),
    date: v.string(),
    time: v.string(),
    notes: v.string(),
    policyAccepted: v.boolean(),
    requestId: v.string(),
  },
  handler: async (ctx, input) => {
    const { policyAccepted: _, ...a } = validateAppointment(input);
    if (!/^[a-f0-9-]{36}$/.test(input.requestId))
      throw Error("Invalid request");
    const prior = await ctx.db
      .query("timadaBookings")
      .withIndex("by_requestId", (q) => q.eq("requestId", input.requestId))
      .unique();
    if (prior) {
      if (
        prior.email !== a.email ||
        prior.serviceSlug !== a.serviceSlug ||
        prior.date !== a.date ||
        prior.time !== a.time
      )
        throw Error("Reload before changing a submitted request");
      return { received: true };
    }
    const service = await ctx.db
      .query("timadaServices")
      .withIndex("by_slug", (q) => q.eq("slug", a.serviceSlug))
      .unique();
    if (!service || !service.active || service.outOfStock)
      throw Error("Service is unavailable");
    if (service.price !== null && service.price >= 50)
      throw Error("Use secure deposit checkout for this service");
    await ctx.db.insert("timadaBookings", {
      ...a,
      requestId: input.requestId,
      ...(service.price !== null ? { servicePrice: service.price } : {}),
      serviceName: service.name,
      amountCents: 0,
      status: "requested",
      createdAt: Date.now(),
      policyVersion: POLICY_VERSION,
      policyAcceptedAt: Date.now(),
    });
    return { received: true };
  },
});
