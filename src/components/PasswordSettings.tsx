import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

export default function PasswordSettings() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  const [mode, setMode] = useState<"idle" | "enable" | "change" | "disable">(
    "idle",
  );
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    invoke<boolean>("is_password_enabled")
      .then(setEnabled)
      .finally(() => setLoading(false));
  }, []);

  function resetForm() {
    setCurrent("");
    setNext("");
    setConfirm("");
    setError(null);
    setMode("idle");
  }

  async function handleEnable() {
    if (next.length < 4) {
      setError("Password must be at least 4 characters.");
      return;
    }
    if (next !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await invoke("set_app_password", {
        current: null,
        newPassword: next,
      });
      setEnabled(true);
      setMessage("Password protection is on");
      resetForm();
    } catch (err) {
      setError(String(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleChange() {
    if (next.length < 4) {
      setError("Password must be at least 4 characters.");
      return;
    }
    if (next !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await invoke("set_app_password", {
        current,
        newPassword: next,
      });
      setMessage("Password updated");
      resetForm();
    } catch (err) {
      setError(String(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleDisable() {
    setBusy(true);
    setError(null);
    try {
      await invoke("clear_app_password", { current });
      setEnabled(false);
      setMessage("Password protection is off");
      resetForm();
    } catch (err) {
      setError(String(err));
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-white/45">Loading password settings…</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[15px] font-medium text-white/90">
            Password protection
          </p>
          <p className="mt-0.5 text-sm text-white/45">
            {enabled
              ? "Required each time you open Kura"
              : "Optional lock screen when the app starts"}
          </p>
        </div>

        {!enabled && mode === "idle" && (
          <button
            type="button"
            onClick={() => {
              setMessage(null);
              setMode("enable");
            }}
            className="shrink-0 rounded-lg bg-white/5 px-3 py-2 text-sm text-white/80 transition-colors hover:bg-white/10"
          >
            Turn on
          </button>
        )}

        {enabled && mode === "idle" && (
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => {
                setMessage(null);
                setMode("change");
              }}
              className="rounded-lg bg-white/5 px-3 py-2 text-sm text-white/80 transition-colors hover:bg-white/10"
            >
              Change
            </button>
            <button
              type="button"
              onClick={() => {
                setMessage(null);
                setMode("disable");
              }}
              className="rounded-lg bg-white/5 px-3 py-2 text-sm text-white/80 transition-colors hover:bg-white/10"
            >
              Turn off
            </button>
          </div>
        )}
      </div>

      {message && mode === "idle" && (
        <p className="text-sm text-white/50">{message}</p>
      )}

      {mode === "enable" && (
        <div className="space-y-3 rounded-xl bg-white/[0.03] p-4 ring-1 ring-white/10">
          <p className="text-sm text-white/60">Choose a password</p>
          <input
            type="password"
            placeholder="New password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 outline-none placeholder:text-white/30 focus:border-white/20"
          />
          <input
            type="password"
            placeholder="Confirm password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 outline-none placeholder:text-white/30 focus:border-white/20"
          />
          {error && <p className="text-sm text-red-400/90">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={handleEnable}
              className="rounded-lg bg-white px-3 py-2 text-sm font-medium text-black transition hover:bg-white/90 disabled:opacity-40"
            >
              {busy ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg bg-white/5 px-3 py-2 text-sm text-white/70 transition hover:bg-white/10"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {mode === "change" && (
        <div className="space-y-3 rounded-xl bg-white/[0.03] p-4 ring-1 ring-white/10">
          <p className="text-sm text-white/60">Change password</p>
          <input
            type="password"
            placeholder="Current password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 outline-none placeholder:text-white/30 focus:border-white/20"
          />
          <input
            type="password"
            placeholder="New password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 outline-none placeholder:text-white/30 focus:border-white/20"
          />
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 outline-none placeholder:text-white/30 focus:border-white/20"
          />
          {error && <p className="text-sm text-red-400/90">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={handleChange}
              className="rounded-lg bg-white px-3 py-2 text-sm font-medium text-black transition hover:bg-white/90 disabled:opacity-40"
            >
              {busy ? "Saving…" : "Update"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg bg-white/5 px-3 py-2 text-sm text-white/70 transition hover:bg-white/10"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {mode === "disable" && (
        <div className="space-y-3 rounded-xl bg-white/[0.03] p-4 ring-1 ring-white/10">
          <p className="text-sm text-white/60">
            Enter your password to turn protection off
          </p>
          <input
            type="password"
            placeholder="Current password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 outline-none placeholder:text-white/30 focus:border-white/20"
          />
          {error && <p className="text-sm text-red-400/90">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy || !current}
              onClick={handleDisable}
              className="rounded-lg bg-white px-3 py-2 text-sm font-medium text-black transition hover:bg-white/90 disabled:opacity-40"
            >
              {busy ? "Working…" : "Turn off"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg bg-white/5 px-3 py-2 text-sm text-white/70 transition hover:bg-white/10"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
