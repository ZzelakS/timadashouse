import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { SectionErrorBoundary } from "./SectionErrorBoundary";
function Content() {
  const rows = useQuery(api.training.list),
    update = useMutation(api.training.update);
  const [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <section>
      <h1 className="display text-4xl">Training sign-ups</h1>
      <p>
        These are inquiries. Contact students to agree dates, fees and
        enrollment. Status changes send no automatic email. Latest 300
        registrations.
      </p>
      {message && <p role="status">{message}</p>}
      {!rows ? (
        <p>Loading…</p>
      ) : !rows.length ? (
        <p>No training sign-ups yet.</p>
      ) : (
        rows.map((r) => (
          <article key={r._id} className="border-b py-5">
            <h2 className="display text-2xl">
              {r.name} · {r.course}
            </h2>
            <p>
              {r.email} · {r.phone} · {r.experience}
            </p>
            <p className="whitespace-pre-wrap">{r.message}</p>
            <label>
              Status{" "}
              <select
                disabled={busy}
                value={r.status}
                onChange={async (e) => {
                  setBusy(true);
                  try {
                    await update({
                      id: r._id,
                      status: e.target.value as typeof r.status,
                    });
                    setMessage("Registration updated.");
                  } catch {
                    setMessage("Unable to update registration.");
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {["new", "contacted", "enrolled", "closed"].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
          </article>
        ))
      )}
    </section>
  );
}
export function TrainingAdmin() {
  return (
    <SectionErrorBoundary name="Training sign-ups">
      <Content />
    </SectionErrorBoundary>
  );
}
