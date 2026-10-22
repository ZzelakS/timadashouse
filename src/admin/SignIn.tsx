import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";

// Email/password sign-in only. Accounts are created privately by the deployment owner.
export function SignIn() {
  const { signIn } = useAuthActions();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError(null);

    if (!email.includes("@"))
      return setError("That does not look like an email address.");
    if (password.length < 12)
      return setError("Use at least twelve characters.");

    setBusy(true);
    try {
      await signIn("password", {
        email: email.trim().toLowerCase(),
        password,
        flow: "signIn",
      });
    } catch {
      setError(
        "Unable to sign in. Check your email and password, or ask the deployment owner to create your studio account.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-sm py-16">
      <h1 className="display text-4xl">Sign in</h1>
      <p className="mt-3 text-sm text-mocha">
        Studio accounts only. Use the email and password set up by the
        deployment owner.
      </p>

      <div className="mt-8 space-y-4">
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Timadashouse@gmail.com"
          aria-label="Email"
          className="w-full border border-ink/20 bg-transparent px-3 py-2 text-sm focus:border-gold focus:outline-none"
        />
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") void submit();
          }}
          placeholder="Password"
          aria-label="Password"
          className="w-full border border-ink/20 bg-transparent px-3 py-2 text-sm focus:border-gold focus:outline-none"
        />
        <button
          type="button"
          onClick={submit}
          disabled={busy}
          className="hud w-full border border-gold bg-gold/10 py-3 transition-colors hover:bg-gold/20 disabled:opacity-50"
        >
          {busy ? "Working…" : "Sign in"}
        </button>

        {error ? <p className="text-sm text-red-700">{error}</p> : null}
      </div>
    </div>
  );
}
