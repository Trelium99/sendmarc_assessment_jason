import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router/dom";
import { ColorModeProvider } from "./color-mode.tsx";
import { router } from "./router.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ColorModeProvider>
      <RouterProvider router={router} />
    </ColorModeProvider>
  </StrictMode>,
);
