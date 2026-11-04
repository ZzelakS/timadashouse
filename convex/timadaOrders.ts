import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import { PRODUCT_SHIPPING_FEE } from "../shared/pricing";

const itemValidator = v.object({ productId: v.string(), quantity: v.number(), length: v.optional(v.string()) });

export const createPending = internalMutation({
  args: { requestId: v.string(), customer: v.string(), items: v.array(itemValidator) },
  handler: async (ctx, args) => {
    if (!/^[a-f0-9-]{36}$/.test(args.requestId) || args.items.length < 1 || args.items.length > 30) throw new Error("Invalid order request");
    const prior = await ctx.db.query("timadaProductOrders").withIndex("by_requestId", q => q.eq("requestId", args.requestId)).unique();
    if (prior) return { id: prior._id, amountCents: prior.amountCents, items: prior.items, shippingCents: prior.shippingCents };
    const items = [];
    for (const line of args.items) {
      if (!Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > 20) throw new Error("Invalid product quantity");
      const product = await ctx.db.query("products").withIndex("by_slug", q => q.eq("slug", line.productId)).unique();
      if (!product || !product.active || product.outOfStock) throw new Error("One or more products are unavailable");
      if (line.length && (!product.lengths || !product.lengths.includes(line.length))) throw new Error(`The selected option for ${product.name} is unavailable`);
      items.push({ productId: product.slug, name: product.name, quantity: line.quantity, unitAmount: Math.round(product.price * 100), ...(line.length ? { length: line.length } : {}) });
    }
    const subtotalCents = items.reduce((sum, item) => sum + item.unitAmount * item.quantity, 0);
    const shippingCents = Math.round(PRODUCT_SHIPPING_FEE * 100);
    const amountCents = subtotalCents + shippingCents;
    const id = await ctx.db.insert("timadaProductOrders", { requestId: args.requestId, customer: args.customer, items, subtotalCents, shippingCents, amountCents, status: "pending", createdAt: Date.now() });
    return { id, amountCents, items, shippingCents };
  },
});

export const attachSession = internalMutation({
  args: { id: v.id("timadaProductOrders"), sessionId: v.string() },
  handler: async (ctx, args) => { const order = await ctx.db.get(args.id); if (!order || order.status !== "pending") throw new Error("Invalid order"); await ctx.db.patch(args.id, { stripeSessionId: args.sessionId }); },
});

export const getBySession = internalQuery({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => ctx.db.query("timadaProductOrders").withIndex("by_session", q => q.eq("stripeSessionId", args.sessionId)).unique(),
});

export const markPaid = internalMutation({
  args: { sessionId: v.string(), paymentIntent: v.optional(v.string()) },
  handler: async (ctx, args) => { const order = await ctx.db.query("timadaProductOrders").withIndex("by_session", q => q.eq("stripeSessionId", args.sessionId)).unique(); if (!order || order.status === "cancelled") return false; if (order.status !== "paid") await ctx.db.patch(order._id, { status: "paid", stripePaymentIntent: args.paymentIntent, paidAt: Date.now() }); return true; },
});

export const cancelPending = internalMutation({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => { const order = await ctx.db.query("timadaProductOrders").withIndex("by_session", q => q.eq("stripeSessionId", args.sessionId)).unique(); if (!order) return false; if (order.status === "pending") await ctx.db.patch(order._id, { status: "cancelled" }); return true; },
});
