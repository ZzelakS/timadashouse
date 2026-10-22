import type { MutationCtx } from "./_generated/server";
export const catalogueStateKey = "timada-catalog-initialized";
export async function markCatalogueInitialized(ctx: MutationCtx) {
  const state = await ctx.db
    .query("serviceSettings")
    .withIndex("by_key", (q) => q.eq("key", catalogueStateKey))
    .unique();
  if (!state)
    await ctx.db.insert("serviceSettings", {
      key: catalogueStateKey,
      extras: [],
      updatedAt: Date.now(),
    });
}
