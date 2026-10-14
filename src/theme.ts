import { createTheme, type PaletteMode } from "@mui/material/styles";

export function createAppTheme(mode: PaletteMode) {
  return createTheme({
    palette: {
      mode,
      ...(mode === "dark"
        ? {
            background: {
              default: "#09090b",
              paper: "#18181b",
            },
          }
        : {
            background: {
              default: "#fafafa",
              paper: "#ffffff",
            },
          }),
    },
  });
}
