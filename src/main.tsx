import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import "./index.css";
import { router } from "./routes";
import { ThemeProvider } from "./theme";
import { AmbientProvider } from "./AmbientContext";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider>
      <AmbientProvider>
        <RouterProvider router={router} />
      </AmbientProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
