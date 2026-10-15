import BuildCircleOutlinedIcon from "@mui/icons-material/BuildCircleOutlined";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import ErrorOutlineOutlinedIcon from "@mui/icons-material/ErrorOutlineOutlined";
import {
  Alert,
  Box,
  Chip,
  List,
  ListItem,
  ListItemText,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import {
  describeActivity,
  LOOKUP_ACTIVITY_EVENT,
  type LookupActivityEvent,
} from "../lib/lookup-activity.ts";

function webMcpReady(): boolean {
  return Boolean(document.modelContext?.registerTool && document.modelContext?.executeTool);
}

export function LookupActivityPanel() {
  const [ready, setReady] = useState(webMcpReady);
  const [events, setEvents] = useState<LookupActivityEvent[]>([]);

  useEffect(() => {
    setReady(webMcpReady());
  }, []);

  useEffect(() => {
    const onActivity = (event: Event) => {
      const custom = event as CustomEvent<LookupActivityEvent>;
      if (!custom.detail) return;
      setEvents((prev) => [custom.detail, ...prev].slice(0, 6));
    };
    window.addEventListener(LOOKUP_ACTIVITY_EVENT, onActivity);
    return () => window.removeEventListener(LOOKUP_ACTIVITY_EVENT, onActivity);
  }, []);

  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, alignItems: "center", mb: 1.5 }}>
        <Typography variant="subtitle2" component="p">
          WebMCP integration
        </Typography>
        <Chip
          size="small"
          icon={ready ? <CheckCircleOutlinedIcon /> : <ErrorOutlineOutlinedIcon />}
          label={ready ? "score_domain registered" : "WebMCP unavailable — enable Chrome flag"}
          color={ready ? "success" : "warning"}
          variant="outlined"
        />
        <Chip
          size="small"
          icon={<BuildCircleOutlinedIcon />}
          label="Inspector & assistant use the same tool"
          variant="outlined"
        />
      </Box>

      {events.length === 0 ? (
        <Alert severity="info" sx={{ py: 0.5 }}>
          Run a lookup via the form, the assistant (bottom-right), or the Model Context Tool Inspector
          with <strong>score_domain</strong> — each path updates this page and appears here.
        </Alert>
      ) : (
        <List dense disablePadding sx={{ bgcolor: "action.hover", borderRadius: 1, px: 1 }}>
          {events.map((item) => (
            <ListItem key={item.at} disableGutters divider>
              <ListItemText
                primary={
                  <Typography variant="body2">{describeActivity(item)}</Typography>
                }
                secondary={
                  <Typography variant="caption" color="text.secondary">
                    {new Date(item.at).toLocaleTimeString()}
                  </Typography>
                }
              />
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
}
