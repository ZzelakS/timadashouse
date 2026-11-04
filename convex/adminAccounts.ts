import { createAccount } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { isStudioEmail } from "../shared/adminPolicy";

/** Deployment-owner only. Run privately from the Convex dashboard, never from a website form. */
export const provision = internalAction({
  args: { email: v.string(), password: v.string() },
  returns: v.object({ email: v.string(), userId: v.id("users") }),
  handler: async (ctx, { email: input, password }) => {
    const email = input.trim().toLowerCase();
    if (!isStudioEmail(email, process.env.ADMIN_EMAILS))
      throw new Error("Use one of the two approved studio emails");
    if (password.length < 12 || password.length > 256)
      throw new Error("Use a password between 12 and 256 characters");
    const profile = { email, ownerProvisioned: true };
    const { user } = await createAccount(ctx, {
      provider: "password",
      account: { id: email, secret: password },
      profile,
      shouldLinkViaEmail: false,
      shouldLinkViaPhone: false,
    });
    return { email, userId: user._id };
  },
});
