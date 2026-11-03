import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Lock } from "lucide-react";

interface Props {
  onUnlocked: () => void;
}

export default function LockScreen({ onUnlocked }: Props) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password || busy) return;

    setBusy(true);
    setError(null);
    try {
      const ok = await invoke<boolean>("verify_app_password", { password });
      if (ok) {
        onUnlocked();
      } else {
        setError("Incorrect password");
        setPassword("");
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#f5f5f7] dark:bg-[#0c0c0f]">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-6 px-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/5 dark:bg-white/5 text-neutral-600 dark:text-white/70">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-[17px] font-semibold text-neutral-900 dark:text-white/90">
              Kura is locked
            </h1>
            <p className="mt-1 text-sm text-neutral-500 dark:text-white/45">
              Enter your password to continue
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <input
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-3 py-2.5 text-sm text-neutral-900 dark:text-white/90 outline-none placeholder:text-neutral-400 dark:placeholder:text-white/30 focus:border-black/20 dark:focus:border-white/20 focus:bg-black/[0.06] dark:focus:bg-white/[0.07]"
          />
          {error && <p className="text-sm text-red-500 dark:text-red-400/90">{error}</p>}
        </div>

        <button
          type="submit"
          disabled={busy || !password}
          className="w-full rounded-lg bg-white dark:bg-neutral-900 dark:bg-white px-3 py-2.5 text-sm font-semibold text-neutral-900 dark:text-white dark:text-black transition hover:bg-neutral-800 dark:hover:bg-white/90 disabled:opacity-40"
        >
          {busy ? "Checking…" : "Unlock"}
        </button>
      </form>
    </div>
  );
}
