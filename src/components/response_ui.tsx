import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import DnsOutlinedIcon from "@mui/icons-material/DnsOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  FormControlLabel,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import { useState, type ReactNode } from "react";
import type { DisplayRow, DisplaySection, DomainScoreResponse } from "../lib/domain-score-types.ts";
import { buildDisplaySections, type DisplayMode } from "../lib/format-response-sections.ts";

type ResponseUIProps = {
  response: DomainScoreResponse;
};

const SECTION_ICONS: Record<string, ReactNode> = {
  summary: <AssessmentOutlinedIcon color="primary" />,
  info: <DnsOutlinedIcon color="primary" />,
  impersonation: <ShieldOutlinedIcon color="primary" />,
  privacy: <LockOutlinedIcon color="primary" />,
  marketing: <CampaignOutlinedIcon color="primary" />,
};

/** 12-column dashboard placement on large screens */
const GRID_PLACEMENT: Record<string, { gridColumn: { xs: string; lg: string } }> = {
  summary: { gridColumn: { xs: "1", lg: "1 / -1" } },
  info: { gridColumn: { xs: "1", lg: "span 4" } },
  impersonation: { gridColumn: { xs: "1", lg: "span 8" } },
  privacy: { gridColumn: { xs: "1", lg: "span 6" } },
  marketing: { gridColumn: { xs: "1", lg: "span 6" } },
};

function gridPlacement(sectionId: string, mode: DisplayMode) {
  if (sectionId.startsWith("record-")) {
    return { gridColumn: { xs: "1", lg: mode === "detailed" ? "span 4" : "span 6" } };
  }
  if (mode === "detailed" && (sectionId === "info" || sectionId === "impersonation")) {
    return { gridColumn: { xs: "1", lg: "span 6" } };
  }
  return GRID_PLACEMENT[sectionId] ?? { gridColumn: { xs: "1", lg: "span 4" } };
}

function sectionIcon(sectionId: string): ReactNode {
  if (sectionId.startsWith("record-")) {
    return <DnsOutlinedIcon color="primary" />;
  }
  return SECTION_ICONS[sectionId] ?? <InfoOutlinedIcon color="primary" />;
}

function RowValue({ row }: { row: DisplayRow }) {
  const multiline = row.value.includes("\n") || row.value.length > 56;
  if (multiline) {
    return (
      <Typography
        variant="body2"
        component="p"
        sx={{
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          textAlign: { xs: "left", sm: "right" },
          maxWidth: { sm: "55%" },
          fontFamily:
            row.label.toLowerCase().includes("spf") || row.label.toLowerCase().includes("record")
              ? "ui-monospace, monospace"
              : "inherit",
          fontSize: "0.8rem",
        }}
      >
        {row.value}
      </Typography>
    );
  }

  return (
    <Chip
      label={row.value}
      size="small"
      color={toneColor(row.tone)}
      variant={row.tone === "default" ? "outlined" : "filled"}
    />
  );
}

function toneColor(tone: DisplayRow["tone"]): "default" | "success" | "warning" | "error" {
  if (tone === "success") return "success";
  if (tone === "warning") return "warning";
  if (tone === "error") return "error";
  return "default";
}

function RowIcon({ row }: { row: DisplayRow }) {
  if (row.tone === "success") return <CheckCircleOutlinedIcon fontSize="small" color="success" />;
  if (row.tone === "warning") return <WarningAmberOutlinedIcon fontSize="small" color="warning" />;
  if (row.tone === "error") return <CancelOutlinedIcon fontSize="small" color="error" />;
  return <InfoOutlinedIcon fontSize="small" color="action" />;
}

function SummaryStrip({ section }: { section: DisplaySection }) {
  const icon = SECTION_ICONS.summary;
  const domainRow = section.rows.find((row) => row.label === "Domain");
  const scoreRow = section.rows.find((row) => row.label === "Overall score");

  return (
    <Card
      variant="outlined"
      component="section"
      aria-labelledby="section-summary"
      sx={{ height: "100%", bgcolor: "action.hover" }}
    >
      <CardContent sx={{ py: { xs: 2, lg: 2.5 } }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: { xs: "flex-start", md: "center" },
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start", flex: 1 }}>
            <Box sx={{ mt: 0.25 }}>{icon}</Box>
            <Box>
              <Typography id="section-summary" variant="h6" component="h2">
                {section.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 520 }}>
                {section.description}
              </Typography>
            </Box>
          </Box>
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 1,
              alignItems: "center",
            }}
          >
            {domainRow ? (
              <Chip label={domainRow.value} variant="outlined" icon={<DnsOutlinedIcon />} />
            ) : null}
            {scoreRow ? (
              <Chip
                label={scoreRow.value}
                color={toneColor(scoreRow.tone)}
                size="medium"
                sx={{ fontSize: "1rem", fontWeight: 600, px: 0.5 }}
              />
            ) : null}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

function SectionCard({ section, mode }: { section: DisplaySection; mode: DisplayMode }) {
  const icon = sectionIcon(section.id);
  const placement = gridPlacement(section.id, mode);

  if (section.id === "summary") {
    return (
      <Box sx={placement}>
        <SummaryStrip section={section} />
      </Box>
    );
  }

  return (
    <Box sx={{ ...placement, minHeight: 0, display: "flex" }}>
      <Card
        variant="outlined"
        component="section"
        aria-labelledby={`section-${section.id}`}
        sx={{ height: "100%", width: "100%", display: "flex", flexDirection: "column" }}
      >
        <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column", py: 2 }}>
          <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start", mb: 1.5 }}>
            <Box sx={{ mt: 0.15 }}>{icon}</Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                id={`section-${section.id}`}
                variant="subtitle1"
                component="h2"
                sx={{ fontWeight: 600 }}
              >
                {section.title}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", lineHeight: 1.4 }}
              >
                {section.description}
              </Typography>
            </Box>
          </Box>

          {section.alert ? (
            <Alert
              severity="warning"
              icon={<WarningAmberOutlinedIcon fontSize="small" />}
              sx={{ mb: 1.5, py: 0, "& .MuiAlert-message": { fontSize: "0.8rem" } }}
            >
              {section.alert}
            </Alert>
          ) : null}

          <Stack spacing={1.25} sx={{ flex: 1 }}>
            {section.rows.map((row) => (
              <Box
                key={`${section.id}-${row.label}`}
                sx={{
                  display: "flex",
                  gap: 1,
                  alignItems: "flex-start",
                  pb: 1,
                  borderBottom: 1,
                  borderColor: "divider",
                  "&:last-child": { borderBottom: 0, pb: 0 },
                }}
              >
                <Box sx={{ mt: 0.2 }} aria-hidden>
                  <RowIcon row={row} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box
                    sx={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 0.75,
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Typography variant="body2" component="p" sx={{ fontWeight: 500 }}>
                      {row.label}
                    </Typography>
                    <RowValue row={row} />
                  </Box>
                  {row.hint ? (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mt: 0.25, display: "block", lineHeight: 1.35 }}
                    >
                      {row.hint}
                    </Typography>
                  ) : null}
                </Box>
              </Box>
            ))}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}

function ResultsDashboard({ response, mode }: ResponseUIProps & { mode: DisplayMode }) {
  const sections = buildDisplaySections(response, mode);

  return (
    <>
      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", lg: "repeat(12, 1fr)" },
          alignItems: "stretch",
        }}
      >
        {sections.map((section) => (
          <SectionCard key={section.id} section={section} mode={mode} />
        ))}
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: "block" }}>
        {mode === "summary"
          ? "Summary view hides nameservers, IP lists, and per-record DNS checks. Turn on detailed view for the full technical dashboard."
          : "Detailed view includes nameservers, mail hosts, TTLs, and individual DNS record checks. Internal resolver metadata is still omitted."}
      </Typography>
    </>
  );
}

export default function ResponseUI({ response }: ResponseUIProps) {
  const [showTechnical, setShowTechnical] = useState(false);

  return (
    <Box component="output" aria-live="polite">
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          mb: 2,
        }}
      >
        <FormControlLabel
          label={showTechnical ? "Detailed view" : "Summary view"}
          labelPlacement="start"
          sx={{ mr: 0, gap: 1, color: "text.secondary" }}
          control={
            <Switch
              checked={showTechnical}
              onChange={(_, checked) => setShowTechnical(checked)}
              aria-label="Show detailed technical dashboard"
            />
          }
        />
      </Box>

      <ResultsDashboard
        response={response}
        mode={showTechnical ? "detailed" : "summary"}
      />
    </Box>
  );
}
