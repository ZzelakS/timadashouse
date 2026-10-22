/** One-time, idempotent Timadashouse service catalog seed.
 * Run: npx convex run seedTimada:run
 * Internal mutation: not callable from public frontend.
 */
import { markCatalogueInitialized } from "./timadaCatalogState";
import { internalMutation } from "./_generated/server";

import { timadaServices as services } from "../shared/timadaCatalog";

export const run = internalMutation({
  args: {},
  handler: async (ctx) => {
    await markCatalogueInitialized(ctx);
    let added = 0;
    let skipped = 0;
    for (const service of services) {
      const existing = await ctx.db
        .query("timadaServices")
        .withIndex("by_slug", (q) => q.eq("slug", service.slug))
        .unique();
      if (existing) {
        skipped++;
        continue;
      }
      await ctx.db.insert("timadaServices", { ...service, active: true });
      added++;
    }
    return { total: services.length, added, skipped };
  },
});
