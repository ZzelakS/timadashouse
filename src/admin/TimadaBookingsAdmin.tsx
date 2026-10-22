import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { SectionErrorBoundary } from "./SectionErrorBoundary";
function Content() {
  const rows = useQuery(api.timada.listBookings),
    update = useMutation(api.timada.updateBooking);
  const [draft, setDraft] = useState<{
      id: Id<"timadaBookings">;
      date: string;
      time: string;
      status: "confirmed" | "completed" | "cancelled";
      studioNotes: string;
    } | null>(null),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <section className="admin-editor">
      <h1 className="display text-4xl">Stripe appointments</h1>
      <p>
        Times use America/New_York. Pending records have no verified payment.
        Editing status does not refund payments, charge cancellation fees or
        send notifications. Agree changes with the customer first. Showing the
        latest 300 records.
      </p>
      {message && <p role="status">{message}</p>}
      {draft && (
        <form
          className="border p-5"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              await update(draft);
              setDraft(null);
              setMessage("Appointment updated.");
            } catch (e) {
              setMessage(e instanceof Error ? e.message : "Unable to update");
            } finally {
              setBusy(false);
            }
          }}
        >
          <fieldset disabled={busy}>
            <label>
              Date
              <input
                required
                type="date"
                value={draft.date}
                onChange={(e) => setDraft({ ...draft, date: e.target.value })}
              />
            </label>
            <label>
              Time
              <input
                required
                type="time"
                value={draft.time}
                onChange={(e) => setDraft({ ...draft, time: e.target.value })}
              />
            </label>
            <label>
              Status
              <select
                value={draft.status}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    status: e.target.value as typeof draft.status,
                  })
                }
              >
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </label>
            <label>
              Studio notes
              <textarea
                maxLength={2000}
                value={draft.studioNotes}
                onChange={(e) =>
                  setDraft({ ...draft, studioNotes: e.target.value })
                }
              />
            </label>
            <button>Save</button>
            <button type="button" onClick={() => setDraft(null)}>
              Cancel
            </button>
          </fieldset>
        </form>
      )}
      {!rows ? (
        <p>Loading appointments…</p>
      ) : !rows.length ? (
        <p>No appointments yet.</p>
      ) : (
        rows.map((row) => (
          <article key={row._id} className="border-b py-5">
            <h2 className="display text-2xl">
              {row.name} · {row.status}
            </h2>
            <p>
              {row.serviceName} · {row.date} · {row.time}
            </p>
            <p>
              {row.email} · {row.phone}
            </p>
            <p>
              {row.status === "pending" || row.status === "requested"
                ? "No verified deposit — request only"
                : "Verified deposit: $50 USD"}
            </p>
            {row.notes && <p>Customer notes: {row.notes}</p>}
            {row.studioNotes && <p>Studio notes: {row.studioNotes}</p>}
            <p className="break-all text-xs">
              {row.stripeSessionId || "No Stripe session attached"}
            </p>
            {row.status !== "pending" && row.status !== "requested" && (
              <button
                onClick={() =>
                  setDraft({
                    id: row._id,
                    date: row.date,
                    time: row.time,
                    status: row.status as
                      "confirmed" | "completed" | "cancelled",
                    studioNotes: row.studioNotes ?? "",
                  })
                }
              >
                Edit appointment
              </button>
            )}
          </article>
        ))
      )}
    </section>
  );
}
export function TimadaBookingsAdmin() {
  return (
    <SectionErrorBoundary name="Stripe appointments">
      <Content />
    </SectionErrorBoundary>
  );
}
