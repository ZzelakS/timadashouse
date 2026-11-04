export const POLICY_VERSION = "2026-10-22-verbatim";
export function validateAppointment(
  data: unknown,
  today = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/New_York",
  }),
) {
  if (!data || typeof data !== "object") throw new Error("Invalid booking");
  const a = data as Record<string, unknown>;
  for (const key of [
    "name",
    "email",
    "phone",
    "serviceSlug",
    "date",
    "time",
    "notes",
  ])
    if (typeof a[key] !== "string") throw new Error("Invalid booking details");
  const { name, email, phone, serviceSlug, date, time, notes } = a as Record<
    string,
    string
  >;
  if (
    name.trim().length < 2 ||
    name.length > 120 ||
    email.length > 254 ||
    !/^\S+@\S+\.\S+$/.test(email) ||
    phone.trim().length < 7 ||
    phone.length > 40 ||
    serviceSlug.length > 120 ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !Number.isFinite(Date.parse(date)) ||
    new Date(date).toISOString().slice(0, 10) !== date ||
    date < today ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(time) ||
    notes.length > 1000 ||
    a.policyAccepted !== true
  )
    throw new Error("Check your details and accept the booking policies");
  return {
    name: name.trim(),
    email: email.trim().toLowerCase(),
    phone: phone.trim(),
    serviceSlug,
    date,
    time,
    notes,
    policyAccepted: true as const,
  };
}
