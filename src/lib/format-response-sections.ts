import type { DisplayRow, DisplaySection, DomainScoreResponse } from "./domain-score-types.ts";

export type DisplayMode = "summary" | "detailed";

const REF_KEYS = new Set([
  "dmarc_ref",
  "spf_ref",
  "dkim_ref",
  "tlsrpt_ref",
  "mtasts_ref",
  "bimi_ref",
]);

const SUMMARY_HIDDEN_KEYS = new Set([
  ...REF_KEYS,
  "authority_domain",
  "admin_email",
  "domain_ips",
  "nameservers",
  "mail_servers",
  "has_a_record",
]);

const DETAILED_HIDDEN_KEYS = new Set([
  ...REF_KEYS,
  "cnames",
  "record_parts",
  "redirected_to",
]);

const LABELS: Record<string, string> = {
  has_mx_record: "Configured to receive email",
  has_a_record: "Website address published (A record)",
  dns_provider: "DNS provider",
  mail_provider: "Email provider",
  dmarc_providers: "DMARC support",
  domain_ips: "Website IP addresses",
  nameservers: "Nameservers",
  mail_servers: "Incoming mail servers",
  authority_domain: "Authoritative DNS zone",
  admin_email: "Domain admin contact",
  score: "Category score",
  status: "Check status",
  ttl: "DNS cache time (TTL, seconds)",
  has_dmarc_record: "DMARC protection",
  has_spf_record: "Sender verification (SPF)",
  num_dkim_records: "DKIM signing keys",
  has_tlsrpt_record: "TLS error reporting",
  has_mtasts_record: "Strict transport security (MTA-STS)",
  has_bimi_record: "Brand logo in inbox (BIMI)",
  policy: "DMARC enforcement level",
  subdomain_policy: "Subdomain policy",
  policy_percentage: "Percentage of mail affected",
  num_lookup: "SPF DNS lookups used",
  num_secondary_lookup: "SPF secondary lookups",
  num_void_lookup: "SPF void lookups",
  num_valid_keys: "Valid DKIM keys",
  selectors: "DKIM selectors",
  all_qualifier_name: "SPF fail behaviour",
  entries: "SPF record",
  addresses: "IP addresses",
  nameservers_list: "Nameservers in zone",
  mail_provider_record: "Mail provider (detected)",
  has_policy: "MTA-STS policy published",
  policy_mode: "MTA-STS mode",
  policy_max_age: "MTA-STS max age (seconds)",
  inherited_from: "Inherited from",
  master_name: "Primary nameserver (SOA)",
};

const HINTS: Record<string, string> = {
  has_mx_record: "Mail exchanger records tell the internet where email for this domain should go.",
  has_a_record: "Shows whether the domain publishes addresses for web traffic.",
  has_dmarc_record:
    "DMARC helps mailbox providers detect email that pretends to be from your domain.",
  has_spf_record: "SPF lists which servers are allowed to send email on your behalf.",
  num_dkim_records:
    "DKIM adds a cryptographic signature so receivers can verify message integrity.",
  has_tlsrpt_record: "Optional reporting when email transport encryption fails.",
  has_mtasts_record: "Optional policy that mail servers should use encrypted connections.",
  has_bimi_record: "Optional standard for displaying your logo in supporting inboxes.",
  dns_provider: "Who hosts your domain's DNS settings.",
  mail_provider: "The service that hosts mailboxes for this domain.",
  nameservers: "Servers that answer DNS queries for this domain.",
  domain_ips: "Public addresses currently associated with the domain.",
  mail_servers: "Where incoming email is delivered for this domain.",
  ttl: "How long resolvers may cache this DNS answer.",
  num_lookup: "Mailbox providers allow at most 10 DNS lookups when evaluating SPF.",
  entries: "The SPF text published in DNS (may be long).",
  status: "Outcome of this individual DNS check.",
};

const RECORD_SECTIONS: Record<string, { title: string; description: string }> = {
  soa: {
    title: "SOA record",
    description: "Start of authority — administrative metadata for your DNS zone.",
  },
  ns: {
    title: "NS record",
    description: "Which nameservers are authoritative for this domain.",
  },
  mx: {
    title: "MX record",
    description: "Where incoming email should be delivered.",
  },
  a: {
    title: "A / AAAA record",
    description: "Network addresses published for the domain.",
  },
  dmarc: {
    title: "DMARC record",
    description: "Policy and reporting instructions for impersonation protection.",
  },
  spf: {
    title: "SPF record",
    description: "Which senders are permitted to send email for this domain.",
  },
  dkim: {
    title: "DKIM records",
    description: "Public keys used to verify signed outbound email.",
  },
  tlsrpt: {
    title: "TLS-RPT record",
    description: "Where to send reports about TLS delivery problems.",
  },
  mtasts: {
    title: "MTA-STS record",
    description: "Whether strict transport security is advertised.",
  },
  bimi: {
    title: "BIMI record",
    description: "Brand indicators for supporting inbox providers.",
  },
};

function dmarcPolicyHint(policy: string): string {
  switch (policy.toLowerCase()) {
    case "reject":
      return "Strongest setting — messages that fail checks are usually rejected.";
    case "quarantine":
      return "Failed messages are often delivered to spam or junk folders.";
    case "none":
      return "Reports only — failing messages may still be delivered normally.";
    default:
      return "How strictly mailbox providers should treat failing messages.";
  }
}

function formatPolicy(policy: string): string {
  switch (policy.toLowerCase()) {
    case "reject":
      return "Reject (enforced)";
    case "quarantine":
      return "Quarantine";
    case "none":
      return "None (monitoring only)";
    default:
      return policy;
  }
}

function formatBoolean(value: boolean): string {
  return value ? "Yes" : "No";
}

function statusTone(status: string): DisplayRow["tone"] {
  const normalized = status.toLowerCase();
  if (normalized === "ok") return "success";
  if (normalized === "warn" || normalized === "warning") return "warning";
  if (normalized === "error" || normalized === "fail") return "error";
  return "default";
}

function tagLevelTone(level?: string): DisplayRow["tone"] {
  if (level === "OK") return "success";
  if (level === "Warn" || level === "Warning") return "warning";
  if (level === "Error") return "error";
  return "default";
}

function formatDkimSelectors(value: unknown): string | null {
  if (!Array.isArray(value)) return null;
  const lines = value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const selector = row.selector;
      if (typeof selector !== "string") return null;
      const keyType = row.key_type ? String(row.key_type) : "";
      const keyLength = row.key_length ? String(row.key_length) : "";
      const bits = keyType && keyLength ? ` — ${keyType} ${keyLength}-bit` : "";
      return `${selector}${bits}`;
    })
    .filter(Boolean);
  return lines.length ? lines.join("\n") : null;
}

function formatMailservers(value: unknown): string | null {
  if (!Array.isArray(value)) return null;
  const lines = value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const exchange = row.exchange ?? row.host;
      const pref = row.preference ?? row.priority;
      if (exchange == null) return null;
      return pref != null ? `${pref} → ${exchange}` : String(exchange);
    })
    .filter(Boolean);
  return lines.length ? lines.join("\n") : null;
}

function formatValue(key: string, value: unknown, mode: DisplayMode): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "boolean") return formatBoolean(value);
  if (typeof value === "number") {
    if (key === "score" || key === "score_pct") return `${value}%`;
    return String(value);
  }
  if (Array.isArray(value)) {
    if (key === "mailservers") return formatMailservers(value);
    const items = value.filter((item) => item !== "Unknown" && item !== "");
    if (items.length === 0) return null;
    if (items.every((item) => typeof item === "string" || typeof item === "number")) {
      const separator = mode === "detailed" && items.length > 3 ? "\n" : ", ";
      return items.map(String).join(separator);
    }
    return null;
  }
  if (typeof value === "object") return null;
  return String(value);
}

function rowFromKey(
  key: string,
  value: unknown,
  mode: DisplayMode,
  hintOverride?: string,
): DisplayRow | null {
  const hidden = mode === "summary" ? SUMMARY_HIDDEN_KEYS : DETAILED_HIDDEN_KEYS;
  if (hidden.has(key) || key.endsWith("_ref")) return null;

  if (key === "tags") return null;

  const formatted = formatValue(key, value, mode);
  if (formatted === null) return null;

  let tone: DisplayRow["tone"] = "default";
  if (typeof value === "boolean") {
    tone = value ? "success" : "warning";
  }
  if (key === "score" && typeof value === "number") {
    if (value >= 80) tone = "success";
    else if (value >= 50) tone = "warning";
    else tone = "error";
  }
  if (key === "status" && typeof value === "string") {
    tone = statusTone(value);
  }

  let hint = hintOverride ?? HINTS[key];
  if (key === "policy" || key === "subdomain_policy") {
    hint = dmarcPolicyHint(String(value));
  }

  let label = LABELS[key] ?? key.replace(/_/g, " ");
  let displayValue = formatted;
  if (key === "policy" || key === "subdomain_policy") {
    displayValue = formatPolicy(String(value));
  }

  return { label, value: displayValue, hint, tone };
}

function rowsFromTags(tags: unknown): DisplayRow[] {
  if (!Array.isArray(tags)) return [];
  return tags
    .filter((tag) => tag && typeof tag === "object" && "msg" in tag)
    .map((tag) => {
      const entry = tag as { level?: string; msg?: string };
      return {
        label: entry.level ? `Finding (${entry.level})` : "Finding",
        value: String(entry.msg ?? ""),
        tone: tagLevelTone(entry.level),
      };
    })
    .filter((row) => row.value.length > 0);
}

function rowsFromObject(
  data: Record<string, unknown>,
  mode: DisplayMode,
  extraRows: DisplayRow[] = [],
): DisplayRow[] {
  const rows: DisplayRow[] = [...extraRows];
  for (const [key, value] of Object.entries(data)) {
    if (key === "tags") {
      rows.push(...rowsFromTags(value));
      continue;
    }
    if (key === "mailservers") {
      const formatted = formatMailservers(value);
      if (formatted) {
        rows.push({
          label: LABELS.mail_servers ?? "Mail servers",
          value: formatted,
          hint: HINTS.mail_servers,
        });
      }
      continue;
    }
    if (key === "selectors") {
      const formatted = formatDkimSelectors(value);
      if (formatted) {
        rows.push({
          label: LABELS.selectors,
          value: formatted,
          hint: "Named signing profiles used for DKIM (public key material is not shown).",
        });
      }
      continue;
    }
    if (key === "paths") continue;
    const row = rowFromKey(key, value, mode);
    if (row) rows.push(row);
  }
  return rows;
}

function dmarcFromRecords(
  records: Record<string, unknown> | undefined,
  mode: DisplayMode,
): DisplayRow[] {
  if (mode === "detailed") return [];
  const dmarc = records?.dmarc as Record<string, unknown> | undefined;
  if (!dmarc || typeof dmarc.policy !== "string") return [];

  const rows: DisplayRow[] = [];
  const policyRow = rowFromKey("policy", dmarc.policy, mode);
  if (policyRow) rows.push(policyRow);
  if (typeof dmarc.subdomain_policy === "string" && dmarc.subdomain_policy !== dmarc.policy) {
    const subRow = rowFromKey("subdomain_policy", dmarc.subdomain_policy, mode);
    if (subRow) rows.push(subRow);
  }
  return rows;
}

function spfWarning(records: Record<string, unknown> | undefined): string | null {
  const spf = records?.spf as Record<string, unknown> | undefined;
  if (!spf) return null;

  const numLookup = spf.num_lookup;
  if (typeof numLookup === "number" && numLookup > 10) {
    return "Your sender verification (SPF) setup is more complex than many providers allow. Messages could fail authentication in some cases.";
  }

  const tags = spf.tags as Array<{ level?: string; msg?: string }> | undefined;
  const warnTag = tags?.find((tag) => tag.level === "Warn");
  if (warnTag?.msg === "dns>10") {
    return "SPF exceeds the common limit of 10 DNS lookups. Consider simplifying your SPF record with your IT team.";
  }
  if (warnTag?.msg) {
    return `Sender verification needs attention (${warnTag.msg}).`;
  }

  return null;
}

function scoreTone(score: number): DisplayRow["tone"] {
  if (score >= 80) return "success";
  if (score >= 50) return "warning";
  return "error";
}

function buildRecordSections(
  records: Record<string, unknown> | undefined,
  mode: DisplayMode,
): DisplaySection[] {
  if (mode !== "detailed" || !records) return [];

  const sections: DisplaySection[] = [];

  for (const [recordKey, recordValue] of Object.entries(records)) {
    const meta = RECORD_SECTIONS[recordKey] ?? {
      title: `${recordKey.toUpperCase()} record`,
      description: "DNS check details for this record type.",
    };

    if (recordValue === null) {
      sections.push({
        id: `record-${recordKey}`,
        title: meta.title,
        description: meta.description,
        rows: [{ label: "Status", value: "No record published", tone: "warning" }],
      });
      continue;
    }

    if (typeof recordValue !== "object") continue;

    const record = recordValue as Record<string, unknown>;
    const rows = rowsFromObject(record, mode);
    if (rows.length === 0) continue;

    sections.push({
      id: `record-${recordKey}`,
      title: meta.title,
      description: meta.description,
      rows,
      alert: recordKey === "spf" ? spfWarning(records) ?? undefined : undefined,
    });
  }

  return sections;
}

export function buildDisplaySections(
  data: DomainScoreResponse,
  mode: DisplayMode = "summary",
): DisplaySection[] {
  const sections: DisplaySection[] = [
    {
      id: "summary",
      title: "Overall result",
      description:
        mode === "detailed"
          ? "Headline score plus the domain being assessed."
          : "A single score summarising how well this domain is set up to prevent email impersonation and related issues.",
      rows: [
        { label: "Domain", value: data.domain },
        {
          label: "Overall score",
          value: `${data.score_pct}%`,
          hint: "Higher is better. Scores combine several email security checks.",
          tone: scoreTone(data.score_pct),
        },
      ],
    },
    {
      id: "info",
      title: "Domain & email setup",
      description:
        mode === "detailed"
          ? "Hosting providers, nameservers, mail routing, and published addresses."
          : "Basics about how this domain is hosted and whether it is set up to receive email.",
      rows: rowsFromObject(data.info ?? {}, mode),
    },
    {
      id: "impersonation",
      title: "Impersonation protection",
      description:
        "Settings that help stop criminals from sending email that looks like it comes from your organisation.",
      rows: [
        ...rowsFromObject(data.impersonation ?? {}, mode),
        ...dmarcFromRecords(data.records, mode),
      ],
      alert: mode === "summary" ? spfWarning(data.records) ?? undefined : undefined,
    },
    {
      id: "privacy",
      title: "Transport privacy",
      description:
        "Optional extras that improve visibility and rules for encrypting email between servers.",
      rows: rowsFromObject(data.privacy ?? {}, mode),
    },
    {
      id: "marketing",
      title: "Brand presence",
      description: "Optional features that can show your brand more clearly in compatible mail apps.",
      rows: rowsFromObject(data.marketing ?? {}, mode),
    },
    ...buildRecordSections(data.records, mode),
  ];

  return sections.filter((section) => section.rows.length > 0);
}

export function isDomainScoreResponse(value: unknown): value is DomainScoreResponse {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.domain === "string" &&
    typeof record.score_pct === "number" &&
    typeof record.info === "object" &&
    record.info !== null
  );
}
