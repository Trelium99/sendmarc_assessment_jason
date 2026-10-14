import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import { Box, FormControlLabel, Switch } from "@mui/material";
import { useColorMode } from "../color-mode.tsx";

export function ThemeModeToggle() {
  const { mode, setMode } = useColorMode();
  const isDark = mode === "dark";

  return (
    <FormControlLabel
      label={
        <Box component="span" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          {isDark ? (
            <DarkModeOutlinedIcon fontSize="small" aria-hidden />
          ) : (
            <LightModeOutlinedIcon fontSize="small" aria-hidden />
          )}
          {isDark ? "Dark" : "Light"}
        </Box>
      }
      labelPlacement="start"
      sx={{ mr: 0, ml: 1, gap: 0.5, color: "text.secondary" }}
      control={
        <Switch
          checked={isDark}
          onChange={(_, checked) => setMode(checked ? "dark" : "light")}
          aria-label="Toggle dark mode"
        />
      }
    />
  );
}
