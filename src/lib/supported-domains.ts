/** Fixture domains available in this demo (see README reference table). */
export const DEMO_DOMAINS = [
  "neverssl.com",
  "mit.edu",
  "github.com",
  "sendmarc.com",
  "uber.com",
] as const;

export function normalizeDomain(domain: string): string {
  return domain.trim().toLowerCase();
}
