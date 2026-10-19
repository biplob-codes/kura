import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import "./index.css";
import { router } from "./routes";
import { ThemeProvider } from "./theme";
import { AmbientProvider } from "./AmbientContext";
import LockScreen from "./components/LockScreen";

function Root() {
  const [checking, setChecking] = useState(true);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    invoke<boolean>("is_password_enabled")
      .then((enabled) => setLocked(enabled))
      .catch(() => setLocked(false))
      .finally(() => setChecking(false));
  }, []);

  if (checking) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#0c0c0f]">
        <p className="text-sm text-white/40">Loading…</p>
      </div>
    );
  }

  if (locked) {
    return <LockScreen onUnlocked={() => setLocked(false)} />;
  }

  return (
    <ThemeProvider>
      <AmbientProvider>
        <RouterProvider router={router} />
      </AmbientProvider>
    </ThemeProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);
