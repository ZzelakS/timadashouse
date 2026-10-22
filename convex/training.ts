import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin } from "./products";
export const register = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    course: v.string(),
    experience: v.string(),
    message: v.string(),
    consent: v.boolean(),
    website: v.string(),
  },
  handler: async (ctx, a) => {
    if (
      a.website ||
      !a.consent ||
      a.name.trim().length < 2 ||
      a.name.length > 120 ||
      a.email.length > 254 ||
      !/^\S+@\S+\.\S+$/.test(a.email) ||
      a.phone.trim().length < 7 ||
      a.phone.length > 40 ||
      ![
        "Braiding",
        "Lash extensions",
        "Ombré brows / PMU",
        "Lip blush",
        "Other / help me choose",
      ].includes(a.course) ||
      a.experience.length > 120 ||
      a.message.length > 1000
    )
      throw Error("Check your registration details and consent");
    const email = a.email.trim().toLowerCase();
    const recent = await ctx.db
      .query("trainingRegistrations")
      .withIndex("by_email", (q) => q.eq("email", email))
      .collect();
    if (recent.some((r) => r.createdAt > Date.now() - 86400000))
      throw Error(
        "We already received your registration today. Contact the studio to make changes.",
      );
    const { consent: _, website: __, ...details } = a;
    await ctx.db.insert("trainingRegistrations", {
      ...details,
      name: a.name.trim(),
      email,
      status: "new",
      consentAt: Date.now(),
      createdAt: Date.now(),
    });
    return { received: true };
  },
});
export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return ctx.db.query("trainingRegistrations").order("desc").take(300);
  },
});
export const update = mutation({
  args: {
    id: v.id("trainingRegistrations"),
    status: v.union(
      v.literal("new"),
      v.literal("contacted"),
      v.literal("enrolled"),
      v.literal("closed"),
    ),
  },
  handler: async (ctx, { id, status }) => {
    await requireAdmin(ctx);
    await ctx.db.patch(id, { status });
    return null;
  },
});
