import { api } from "./_generated/api";
import { v } from "convex/values";
import { action, httpAction, internalAction } from "./_generated/server";

/**
 * ImageKit's browser upload needs a token signed with the private key. That key
 * lives in Convex, never in the bundle:
 *
 *   npx convex env set IMAGEKIT_PRIVATE_KEY private_xxx
 */
function hex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function corsHeaders(): Record<string, string> {
  return {
    // tighten to your domain once it is live, e.g. https://calarybeauty.com
    "Access-Control-Allow-Origin":
      process.env.SITE_URL ?? "https://www.timadashouseglam.com",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "no-store",
  };
}

export const authPreflight = httpAction(async () => {
  return new Response(null, { status: 204, headers: corsHeaders() });
});

export const auth = httpAction(
  async () =>
    new Response("Use authenticated studio upload authorization", {
      status: 403,
      headers: corsHeaders(),
    }),
);

export const uploadAuth = action({
  args: {},
  handler: async (ctx) => {
    const viewer = await ctx.runQuery(api.products.viewer, {});
    if (!viewer?.isAdmin) throw new Error("Studio authorization required");
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error("Image uploads are not configured");
    }

    const token = crypto.randomUUID();
    // ImageKit allows up to an hour; ten minutes is plenty for one upload
    const expire = Math.floor(Date.now() / 1000) + 600;

    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(privateKey),
      { name: "HMAC", hash: "SHA-1" },
      false,
      ["sign"],
    );
    const signature = hex(
      await crypto.subtle.sign(
        "HMAC",
        key,
        new TextEncoder().encode(token + expire),
      ),
    );

    return { token, expire, signature };
  },
});

/** Scheduled after a product is deleted or its image replaced. Best effort. */
export const deleteFile = internalAction({
  args: { fileId: v.string() },
  handler: async (_ctx, { fileId }) => {
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
    if (!privateKey) return false;

    const credentials = btoa(`${privateKey}:`);
    const response = await fetch(`https://api.imagekit.io/v1/files/${fileId}`, {
      method: "DELETE",
      headers: { Authorization: `Basic ${credentials}` },
    });

    // 404 means someone already removed it — nothing to worry about
    return response.ok || response.status === 404;
  },
});
