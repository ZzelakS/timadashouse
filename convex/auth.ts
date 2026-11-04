import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";
import { isStudioEmail } from "../shared/adminPolicy";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      profile(params) {
        const email =
          typeof params.email === "string"
            ? params.email.trim().toLowerCase()
            : "";
        if (!isStudioEmail(email, process.env.ADMIN_EMAILS))
          throw new Error("Studio access only");
        if (params.flow !== "signIn")
          throw new Error(
            "Public account creation is disabled. Ask the deployment owner to create your studio account.",
          );
        return { email };
      },
      validatePasswordRequirements(password) {
        if (password.length < 12)
          throw new Error("Use at least twelve characters");
      },
    }),
  ],
  callbacks: {
    async createOrUpdateUser(ctx, args) {
      // Only the deployment-owner internal provisioning action supplies this flag.
      // Public sign-in parameters cannot create accounts or issue admin grants.
      if (
        args.type !== "credentials" ||
        args.profile.ownerProvisioned !== true ||
        typeof args.profile.email !== "string" ||
        !isStudioEmail(args.profile.email, process.env.ADMIN_EMAILS)
      ) {
        throw new Error("Deployment-owner account creation required");
      }
      if (args.existingUserId)
        throw new Error("Existing account requires administrator review");
      const userId = await ctx.db.insert("users", {
        email: args.profile.email,
      });
      await ctx.db.insert("adminGrants", { userId, grantedAt: Date.now() });
      return userId;
    },
  },
});
