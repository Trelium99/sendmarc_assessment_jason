import CloseIcon from "@mui/icons-material/Close";
import SendIcon from "@mui/icons-material/Send";
import SmartToyOutlinedIcon from "@mui/icons-material/SmartToyOutlined";
import {
  Box,
  Chip,
  CircularProgress,
  Fab,
  IconButton,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useId, useRef, useState } from "react";
import type { LookupState } from "../hooks/useDomainAssessment.ts";
import { handleAssistantMessage, type AssistantTurn } from "../lib/assistant-responses.ts";
import { DEMO_DOMAINS } from "../lib/supported-domains.ts";

const DEMO_PROMPTS = DEMO_DOMAINS.map((domain) => `Score ${domain}`);

type PageAssistantProps = {
  lookup: LookupState;
  runLookup: (domain: string, options?: { activitySource?: "form" | "webmcp-tool" | "assistant-direct" }) => Promise<unknown>;
  defaultOpen?: boolean;
};

function formatAssistantText(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <Box
          component="code"
          key={index}
          sx={{ fontFamily: "monospace", fontSize: "0.85em", bgcolor: "action.selected", px: 0.5, borderRadius: 0.5 }}
        >
          {part.slice(1, -1)}
        </Box>
      );
    }
    return part;
  });
}

export function PageAssistant({ lookup, runLookup, defaultOpen = false }: PageAssistantProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<AssistantTurn[]>([
    {
      role: "assistant",
      text:
        "Try **Score mit.edu**, then **What's the DMARC policy?** — I'll use WebMCP when available and the dashboard will update live.",
    },
  ]);
  const listRef = useRef<HTMLDivElement>(null);
  const inputId = useId();
  const titleId = useId();

  const scrollToEnd = useCallback(() => {
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    });
  }, []);

  const sendText = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || busy) return;

      setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
      scrollToEnd();
      setBusy(true);

      await new Promise((resolve) => setTimeout(resolve, 400));

      try {
        const reply = await handleAssistantMessage(trimmed, lookup, runLookup);
        const badge = reply.usedWebMcp ? "\n\n_(WebMCP tool path)_" : "";
        setMessages((prev) => [...prev, { role: "assistant", text: reply.text + badge }]);
      } catch {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", text: "Something went wrong. Please try again." },
        ]);
      } finally {
        setBusy(false);
        scrollToEnd();
      }
    },
    [busy, lookup, runLookup, scrollToEnd],
  );

  const sendMessage = useCallback(() => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    void sendText(text);
  }, [input, sendText]);

  return (
    <>
      {open ? (
        <Paper
          elevation={8}
          role="dialog"
          aria-labelledby={titleId}
          sx={{
            position: "fixed",
            right: 16,
            bottom: 88,
            zIndex: 1300,
            width: { xs: "calc(100% - 32px)", sm: 400 },
            maxWidth: 420,
            height: 480,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            borderRadius: 2,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              px: 2,
              py: 1.25,
              borderBottom: 1,
              borderColor: "divider",
              bgcolor: "action.hover",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <SmartToyOutlinedIcon color="primary" fontSize="small" />
              <Typography id={titleId} variant="subtitle2" component="h2">
                Domain assistant (demo)
              </Typography>
            </Box>
            <IconButton size="small" onClick={() => setOpen(false)} aria-label="Close assistant">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          <Box sx={{ px: 1.5, pt: 1, display: "flex", flexWrap: "wrap", gap: 0.5 }}>
            {DEMO_PROMPTS.map((prompt) => (
              <Chip
                key={prompt}
                label={prompt}
                size="small"
                variant="outlined"
                disabled={busy}
                onClick={() => void sendText(prompt)}
                sx={{ cursor: "pointer" }}
              />
            ))}
          </Box>

          <Box
            ref={listRef}
            sx={{
              flex: 1,
              overflow: "auto",
              p: 1.5,
              display: "flex",
              flexDirection: "column",
              gap: 1,
            }}
            aria-live="polite"
          >
            {messages.map((message, index) => (
              <Box
                key={`${message.role}-${index}`}
                sx={{
                  alignSelf: message.role === "user" ? "flex-end" : "flex-start",
                  maxWidth: "92%",
                  px: 1.25,
                  py: 1,
                  borderRadius: 2,
                  bgcolor: message.role === "user" ? "primary.main" : "action.selected",
                  color: message.role === "user" ? "primary.contrastText" : "text.primary",
                }}
              >
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.45 }}>
                  {message.role === "assistant" ? formatAssistantText(message.text) : message.text}
                </Typography>
              </Box>
            ))}
            {busy ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, py: 0.5 }}>
                <CircularProgress size={16} />
                <Typography variant="caption" color="text.secondary">Thinking…</Typography>
              </Box>
            ) : null}
          </Box>

          <Box
            component="form"
            onSubmit={(event) => {
              event.preventDefault();
              sendMessage();
            }}
            sx={{
              display: "flex",
              gap: 1,
              p: 1.5,
              borderTop: 1,
              borderColor: "divider",
            }}
          >
            <TextField
              id={inputId}
              size="small"
              fullWidth
              placeholder="Ask about a domain…"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              disabled={busy}
              aria-label="Message to assistant"
            />
            <IconButton
              type="submit"
              color="primary"
              disabled={busy || !input.trim()}
              aria-label="Send message"
            >
              <SendIcon />
            </IconButton>
          </Box>
        </Paper>
      ) : null}

      <Fab
        color="primary"
        aria-label="Open domain assistant"
        onClick={() => setOpen((value) => !value)}
        sx={{ position: "fixed", right: 16, bottom: 16, zIndex: 1300 }}
      >
        <SmartToyOutlinedIcon />
      </Fab>
    </>
  );
}
