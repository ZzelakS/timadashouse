import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { isConvexConfigured } from "../lib/convex";
function Registration() {
  const register = useMutation(api.training.register);
  const [form, setForm] = useState({
      name: "",
      email: "",
      phone: "",
      course: "",
      experience: "Beginner",
      message: "",
      consent: false,
      website: "",
    }),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [sent, setSent] = useState(false);
  if (sent)
    return (
      <div className="booking-card" role="status">
        <h2>Thank you for signing up.</h2>
        <p>
          Your training inquiry has been saved. The studio will contact you
          about available classes, dates, fees and enrollment. No payment has
          been taken and your place is not confirmed yet.
        </p>
      </div>
    );
  const field = (
    key:
      | "name"
      | "email"
      | "phone"
      | "experience"
      | "message"
      | "course"
      | "website",
    value: string,
  ) => setForm({ ...form, [key]: value });
  return (
    <form
      className="booking-card"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        try {
          await register(form);
          setSent(true);
        } catch (e) {
          setError(
            e instanceof Error
              ? e.message
              : "Unable to send registration. Please contact the studio.",
          );
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="form-grid">
        <label>
          Full name
          <input
            required
            minLength={2}
            maxLength={120}
            value={form.name}
            onChange={(e) => field("name", e.target.value)}
          />
        </label>
        <label>
          Email
          <input
            required
            type="email"
            maxLength={254}
            value={form.email}
            onChange={(e) => field("email", e.target.value)}
          />
        </label>
        <label>
          Phone
          <input
            required
            type="tel"
            minLength={7}
            maxLength={40}
            value={form.phone}
            onChange={(e) => field("phone", e.target.value)}
          />
        </label>
        <label>
          Class interest
          <select
            required
            value={form.course}
            onChange={(e) => field("course", e.target.value)}
          >
            <option value="">Choose your interest</option>
            {[
              "Braiding",
              "Lash extensions",
              "Ombré brows / PMU",
              "Lip blush",
              "Other / help me choose",
            ].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label>
          Experience
          <select
            value={form.experience}
            onChange={(e) => field("experience", e.target.value)}
          >
            <option>Beginner</option>
            <option>Some experience</option>
            <option>Beauty professional</option>
          </select>
        </label>
      </div>
      <label>
        Availability or questions
        <textarea
          maxLength={1000}
          value={form.message}
          onChange={(e) => field("message", e.target.value)}
          placeholder="Tell us your preferred dates and what you hope to learn. Please do not include medical or payment information."
        />
      </label>
      <label style={{ display: "none" }} aria-hidden="true">
        Website
        <input
          tabIndex={-1}
          autoComplete="off"
          value={form.website}
          onChange={(e) => field("website", e.target.value)}
        />
      </label>
      <label className="policy-check">
        <input
          type="checkbox"
          required
          checked={form.consent}
          onChange={(e) => setForm({ ...form, consent: e.target.checked })}
        />
        <span>
          I agree to be contacted about this training inquiry and have read the{" "}
          <Link to="/policies" className="underline">
            training policies
          </Link>
          . I understand dates, fees and my place must be confirmed separately.
        </span>
      </label>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <button disabled={busy} className="gold-button">
        {busy ? "Sending…" : "Submit training sign-up"}
      </button>
    </form>
  );
}
export function Training() {
  return (
    <main className="registration">
      <div className="registration-intro">
        <span className="eyebrow">LEARN WITH TIMADASHOUSE</span>
        <h1>
          Develop your <em>artistry.</em>
        </h1>
        <p>
          Sign up for training updates and tell us what you would like to learn.
        </p>
        <p>
          The studio will confirm course availability, dates, fees and
          requirements with you.
        </p>
      </div>
      {isConvexConfigured ? (
        <Registration />
      ) : (
        <div className="booking-card">
          <p>
            Online training registration is not connected yet. Contact{" "}
            <a className="underline" href="mailto:Timadashouse@gmail.com">
              Timadashouse@gmail.com
            </a>{" "}
            to discuss training.
          </p>
        </div>
      )}
    </main>
  );
}
