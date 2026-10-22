export const studioEmails = [
  "timadashouse@gmail.com",
  "timadashouse@yahoo.com",
] as const;
export function isStudioEmail(email: string, configured?: string) {
  const normalized = email.trim().toLowerCase();
  return (
    studioEmails.some((value) => value === normalized) &&
    (!configured ||
      configured
        .split(",")
        .some((value) => value.trim().toLowerCase() === normalized))
  );
}
