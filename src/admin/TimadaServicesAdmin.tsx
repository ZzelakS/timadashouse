import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { SectionErrorBoundary } from "./SectionErrorBoundary";
import { ImageField } from "./ImageField";
import { timadaServices } from "../../shared/timadaCatalog";
type Draft = {
  slug: string;
  name: string;
  category: string;
  price: number | null;
  duration: string;
  description: string;
  image: string;
  imageFileId?: string;
  images: { url: string; fileId?: string }[];
  active: boolean;
  outOfStock: boolean;
  creating: boolean;
};
function Content() {
  const rows = useQuery(api.timada.allServices),
    save = useMutation(api.timada.saveService),
    remove = useMutation(api.timada.removeService),
    seed = useMutation(api.timada.seed);
  const [draft, setDraft] = useState<Draft | null>(null),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const [uploads, setUploads] = useState(0);
  const uploadChanged = (uploading: boolean) =>
    setUploads((count) => Math.max(0, count + (uploading ? 1 : -1)));
  async function attempt(task: () => Promise<unknown>, success: string) {
    setBusy(true);
    try {
      await task();
      setMessage(success);
      return true;
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Unable to save");
      return false;
    } finally {
      setBusy(false);
    }
  }
  if (!rows) return <p>Loading studio services…</p>;
  return (
    <section className="admin-editor">
      <h1 className="display text-4xl">Beauty services</h1>
      <p>
        These services power the public menu and Stripe appointment form. Hidden
        services leave the menu; unavailable services remain visible and cannot
        be booked. Prices below $50 and consultation prices submit a booking
        request for studio review.
      </p>
      <button
        disabled={busy}
        onClick={() =>
          setDraft({
            slug: "",
            name: "",
            category: "",
            price: null,
            duration: "",
            description: "",
            image: "",
            images: [],
            active: true,
            outOfStock: false,
            creating: true,
          })
        }
      >
        New service
      </button>
      <button
        disabled={busy}
        onClick={() =>
          void attempt(
            () => seed({ services: timadaServices.map((s) => ({ ...s })) }),
            "Missing services added; existing edits preserved.",
          )
        }
      >
        Add missing starter services
      </button>
      {message && <p role="status">{message}</p>}
      {draft && (
        <form
          className="my-6 border p-6"
          onSubmit={async (e) => {
            e.preventDefault();
            if (uploads) {
              setMessage("Wait for the image upload to finish before saving.");
              return;
            }
            if (
              await attempt(
                () =>
                  save({
                    ...draft,
                    images: draft.images.filter((photo) => photo.url.trim()),
                  }),
                "Service saved.",
              )
            )
              setDraft(null);
          }}
        >
          <fieldset disabled={busy || uploads > 0}>
            <h2 className="display text-2xl">
              {draft.creating ? "New" : "Edit"} service
            </h2>
            {(["slug", "name", "category", "duration"] as const).map((key) => (
              <label key={key}>
                {key}
                <input
                  required={key !== "duration"}
                  maxLength={120}
                  readOnly={key === "slug" && !draft.creating}
                  value={draft[key]}
                  onChange={(e) =>
                    setDraft({ ...draft, [key]: e.target.value })
                  }
                />
              </label>
            ))}
            <label>
              Starting price ($); leave empty for consultation
              <input
                type="number"
                min={0}
                step="0.01"
                value={draft.price ?? ""}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    price:
                      e.target.value === "" ? null : Number(e.target.value),
                  })
                }
              />
            </label>
            <label>
              Description
              <textarea
                maxLength={2000}
                value={draft.description}
                onChange={(e) =>
                  setDraft({ ...draft, description: e.target.value })
                }
              />
            </label>
            <h3 className="display text-2xl">Service images</h3>
            <p>
              Add a main photo and up to 8 gallery photos. Upload a file or
              paste an image URL.
            </p>
            <ImageField
              onUploadingChange={uploadChanged}
              value={draft.image}
              fileId={draft.imageFileId}
              onChange={(image, imageFileId) =>
                setDraft((current) =>
                  current ? { ...current, image, imageFileId } : null,
                )
              }
            />
            {draft.image && (
              <button
                type="button"
                onClick={() =>
                  setDraft({ ...draft, image: "", imageFileId: undefined })
                }
              >
                Remove main photo
              </button>
            )}
            {draft.images.map((photo, index) => (
              <div key={index} className="my-4 border p-4">
                <h4>Gallery photo {index + 1}</h4>
                <ImageField
                  onUploadingChange={uploadChanged}
                  value={photo.url}
                  fileId={photo.fileId}
                  onChange={(url, fileId) =>
                    setDraft((current) =>
                      current
                        ? {
                            ...current,
                            images: current.images.map((item, i) =>
                              i === index ? { url, fileId } : item,
                            ),
                          }
                        : null,
                    )
                  }
                />
                <button
                  type="button"
                  onClick={() =>
                    setDraft({
                      ...draft,
                      images: draft.images.filter((_, i) => i !== index),
                    })
                  }
                >
                  Remove gallery photo {index + 1}
                </button>
              </div>
            ))}
            <button
              type="button"
              disabled={draft.images.length >= 8}
              onClick={() =>
                setDraft({ ...draft, images: [...draft.images, { url: "" }] })
              }
            >
              Add gallery photo
            </button>
            <label>
              <input
                type="checkbox"
                checked={draft.active}
                onChange={(e) =>
                  setDraft({ ...draft, active: e.target.checked })
                }
              />{" "}
              Show on menu
            </label>
            <label>
              <input
                type="checkbox"
                checked={draft.outOfStock}
                onChange={(e) =>
                  setDraft({ ...draft, outOfStock: e.target.checked })
                }
              />{" "}
              Unavailable / out of stock
            </label>
            <button type="submit" disabled={uploads > 0}>
              {uploads ? "Uploading images…" : "Save service"}
            </button>
            <button type="button" onClick={() => setDraft(null)}>
              Cancel
            </button>
          </fieldset>
        </form>
      )}
      <div className="mt-6">
        {rows.map((s) => (
          <article key={s.slug} className="border-b py-4">
            {s.image && (
              <img
                src={s.image}
                alt={s.name}
                className="h-20 w-20 object-cover"
              />
            )}
            <h2 className="display text-2xl">{s.name}</h2>
            <p>
              {s.category} · {s.price === null ? "Consultation" : `$${s.price}`}{" "}
              ·{" "}
              {!s.active
                ? "Hidden"
                : s.outOfStock
                  ? "Unavailable"
                  : "Available"}
            </p>
            <button
              disabled={busy}
              onClick={() =>
                setDraft({
                  slug: s.slug,
                  name: s.name,
                  category: s.category,
                  price: s.price,
                  duration: s.duration,
                  description: s.description,
                  image: s.image ?? "",
                  imageFileId: s.imageFileId,
                  images: (s.images ?? []).map((photo) => ({ ...photo })),
                  active: s.active,
                  outOfStock: s.outOfStock ?? false,
                  creating: false,
                })
              }
            >
              Edit
            </button>
            <button
              disabled={busy}
              onClick={() => {
                if (
                  window.confirm(
                    `Delete ${s.name}? Existing appointments are preserved.`,
                  )
                )
                  void attempt(
                    () => remove({ slug: s.slug }),
                    "Service removed.",
                  );
              }}
            >
              Delete
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
export function TimadaServicesAdmin() {
  return (
    <SectionErrorBoundary name="Beauty services">
      <Content />
    </SectionErrorBoundary>
  );
}
