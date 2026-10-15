import github from "./fixtures/github.com.json";
import mit from "./fixtures/mit.edu.json";
import neverssl from "./fixtures/neverssl.com.json";
import sendmarc from "./fixtures/sendmarc.com.json";
import uber from "./fixtures/uber.com.json";
import { DEMO_DOMAINS } from "./lib/supported-domains.ts";

const byDomain: Record<string, unknown> = {
  "neverssl.com": neverssl,
  "mit.edu": mit,
  "github.com": github,
  "sendmarc.com": sendmarc,
  "uber.com": uber,
};

export function fixtureFor(domain: string): unknown {
  const key = domain.trim().toLowerCase();
  if (key in byDomain) {
    return byDomain[key];
  }
  throw new Error(
    `No fixture for ${domain}. Demo domains: ${DEMO_DOMAINS.join(", ")}.`,
  );
}
