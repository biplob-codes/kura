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
      <div className="flex h-screen w-screen items-center justify-center bg-[#f5f5f7] dark:bg-[#0c0c0f]">
        <p className="text-sm text-neutral-400 dark:text-white/40">Loading…</p>
      </div>
    );
  }

  if (locked) {
    return <LockScreen onUnlocked={() => setLocked(false)} />;
  }

  return (
    <AmbientProvider>
      <RouterProvider router={router} />
    </AmbientProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider>
      <Root />
    </ThemeProvider>
  </React.StrictMode>,
);
