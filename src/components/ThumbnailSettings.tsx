import { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

interface AppConfig {
  inbox: string;
  library: string;
  use_thumbnails: boolean;
  thumbnail_percent: number;
  database_url: string;
}

interface SettingsResult {
  success: boolean;
  config?: AppConfig;
  message?: string;
}

interface ThumbnailPipelineSetupProps {
  useThumbnails: boolean;
  thumbnailPercent: number;
  databaseUrl: string;
}

const STAGES = [
  "Setting up things",
  "Connecting to database",
  "Running migrations",
  "Finishing up",
];

const STAGE_INTERVAL_MS = 1100;

export default function ThumbnailPipelineSetup({
  useThumbnails,
  thumbnailPercent,
  databaseUrl,
}: ThumbnailPipelineSetupProps) {
  const [enabled, setEnabled] = useState(useThumbnails);
  const [percent, setPercent] = useState(thumbnailPercent);
  const [db, setDb] = useState(databaseUrl);
  const [configured, setConfigured] = useState(
    useThumbnails && Boolean(databaseUrl),
  );

  const [loading, setLoading] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  const stageTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (stageTimer.current) clearInterval(stageTimer.current);
    };
  }, []);

  const dbUrlLooksValid = /^postgres(ql)?:\/\/\S+/.test(db.trim());
  const percentValid = percent >= 1 && percent <= 100;
  const canSetUp = enabled && percentValid && dbUrlLooksValid && !loading;

  function handleToggle() {
    const next = !enabled;
    setEnabled(next);
    setError(null);
    if (!next) setJustSaved(false);
  }

  function handlePercentChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    if (raw === "") {
      setPercent(0);
      return;
    }
    const value = Number(raw);
    if (Number.isNaN(value)) return;
    setPercent(Math.min(100, Math.max(1, value)));
  }

  function handlePercentBlur() {
    if (percent < 1) setPercent(1);
  }

  async function handleSetup() {
    if (!canSetUp) return;

    setError(null);
    setJustSaved(false);
    setLoading(true);
    setStageIndex(0);

    stageTimer.current = setInterval(() => {
      setStageIndex((i) => Math.min(i + 1, STAGES.length - 1));
    }, STAGE_INTERVAL_MS);

    try {
      const result = await invoke<SettingsResult>("update_settings", {
        useDatabase: true,
        databaseUrl: db.trim(),
        useThumbnails: true,
        thumbnailPercent: percent,
      });

      if (stageTimer.current) clearInterval(stageTimer.current);

      if (result.success && result.config) {
        setEnabled(result.config.use_thumbnails);
        setPercent(result.config.thumbnail_percent);
        setDb(result.config.database_url);
        setConfigured(true);
        setJustSaved(true);
        setTimeout(() => setJustSaved(false), 2500);
      } else {
        setError(
          result.message ??
            "Setup failed. Please check your database URL and try again.",
        );
      }
    } catch (err) {
      if (stageTimer.current) clearInterval(stageTimer.current);
      console.error("Failed to set up thumbnail pipeline:", err);
      setError(
        "Something went wrong while setting things up. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Toggle */}
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[15px] font-medium text-neutral-900 dark:text-white/90">
            Thumbnail generation
          </p>
          <p className="mt-0.5 text-sm text-neutral-500 dark:text-white/45">
            Capture a frame when videos are transferred (needs ffmpeg +
            Postgres)
          </p>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          disabled={loading}
          onClick={handleToggle}
          className={[
            "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-60",
            enabled
              ? "bg-neutral-900 dark:bg-white"
              : "bg-black/15 dark:bg-white/15",
          ].join(" ")}
        >
          <span
            className={[
              "inline-block h-4 w-4 transform rounded-full shadow transition-transform duration-200",
              enabled
                ? "translate-x-6 bg-white dark:bg-neutral-950"
                : "translate-x-1 bg-white dark:bg-neutral-950",
            ].join(" ")}
          />
        </button>
      </div>

      {enabled && (
        <>
          {/* Capture point */}
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[15px] font-medium text-neutral-900 dark:text-white/90">
                Capture point
              </p>
              <p className="mt-0.5 text-sm text-neutral-500 dark:text-white/45">
                How far into the video to take the thumbnail
              </p>
            </div>

            <div className="flex items-center gap-1.5 rounded-lg bg-black/5 px-2.5 py-2 dark:bg-white/5">
              <input
                type="number"
                min={1}
                max={100}
                value={percent === 0 ? "" : percent}
                onChange={handlePercentChange}
                onBlur={handlePercentBlur}
                disabled={loading}
                className="w-10 bg-transparent text-right text-sm text-neutral-900 outline-none disabled:text-neutral-400 dark:text-white dark:disabled:text-white/40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="text-sm text-neutral-500 dark:text-white/45">
                %
              </span>
            </div>
          </div>

          {/* Database URL */}
          <div>
            <p className="text-[15px] font-medium text-neutral-900 dark:text-white/90">
              Database URL
            </p>
            <p className="mt-0.5 mb-2 text-sm text-neutral-500 dark:text-white/45">
              PostgreSQL connection string
            </p>
            <input
              type="text"
              value={db}
              onChange={(e) => setDb(e.target.value)}
              disabled={loading}
              placeholder="postgres://user:password@localhost:5432/kura"
              className="w-full rounded-lg bg-black/5 px-3 py-2.5 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:ring-1 focus:ring-black/15 disabled:text-neutral-400 dark:bg-white/5 dark:text-white dark:placeholder:text-white/30 dark:focus:ring-white/20 dark:disabled:text-white/40"
            />
            {db.trim().length > 0 && !dbUrlLooksValid && (
              <p className="mt-1.5 text-sm text-amber-500 dark:text-amber-400">
                This should be a postgres:// connection string
              </p>
            )}
          </div>

          {/* Setup action */}
          <div className="flex items-center justify-between gap-4 pt-1">
            <p className="text-sm text-neutral-500 dark:text-white/40">
              {configured
                ? "Thumbnails are set up. Re-run to apply changes."
                : "Nothing is saved until you run setup."}
            </p>

            <button
              type="button"
              onClick={handleSetup}
              disabled={!canSetUp}
              className="shrink-0 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-black/10 disabled:text-neutral-400 dark:bg-white dark:text-neutral-950 dark:hover:bg-white/90 dark:disabled:bg-white/15 dark:disabled:text-white/40"
            >
              {loading ? `${STAGES[stageIndex]}…` : "Set up"}
            </button>
          </div>
        </>
      )}

      {error && (
        <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
      )}
      {justSaved && (
        <p className="text-sm text-neutral-500 dark:text-white/60">
          Thumbnail generation is ready.
        </p>
      )}
    </div>
  );
}
