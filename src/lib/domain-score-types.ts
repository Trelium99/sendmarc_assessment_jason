export type DomainScoreResponse = {
  domain: string;
  score_pct: number;
  info: Record<string, unknown>;
  impersonation: Record<string, unknown>;
  privacy: Record<string, unknown>;
  marketing: Record<string, unknown>;
  records?: Record<string, unknown>;
};

export type DisplayRow = {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "success" | "warning" | "error";
};

export type DisplaySection = {
  id: string;
  title: string;
  description: string;
  rows: DisplayRow[];
  alert?: string;
};
