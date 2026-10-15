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
    <div className="w-full max-w-4xl mx-auto py-6">
      <h1 className="text-[15px] font-semibold tracking-[-0.02em] text-[#1d1d1f] dark:text-[#f5f5f7]">
        Thumbnail generation
      </h1>
      <p className="mt-1 text-[13px] text-[#86868b] dark:text-[#98989d]">
        Automatically capture a thumbnail when videos are transferred. Requires
        ffmpeg and a PostgreSQL database.
      </p>

      <div className="mt-4 rounded-[12px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#2c2c2e] overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-black/[0.06] dark:border-white/[0.08]">
          <div>
            <p className="text-[13px] font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">
              Enable thumbnail generation
            </p>
            <p className="text-[12px] text-[#86868b] dark:text-[#98989d]">
              Requires ffmpeg and a connected PostgreSQL database
            </p>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            disabled={loading}
            onClick={handleToggle}
            className={`relative inline-flex h-[26px] w-[46px] shrink-0 items-center rounded-full transition-colors duration-200 ease-out focus:outline-none disabled:opacity-60 cursor-pointer ${
              enabled
                ? "bg-[#34C759] dark:bg-[#30D158]"
                : "bg-[#e5e5ea] dark:bg-[#3a3a3c]"
            }`}
          >
            <span
              className={`inline-block h-[22px] w-[22px] transform rounded-full bg-white shadow-sm transition-transform duration-200 ease-out ${
                enabled ? "translate-x-[22px]" : "translate-x-[2px]"
              }`}
            />
          </button>
        </div>

        {enabled && (
          <>
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-black/[0.06] dark:border-white/[0.08]">
              <div>
                <p className="text-[13px] font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">
                  Capture point
                </p>
                <p className="text-[12px] text-[#86868b] dark:text-[#98989d]">
                  How far into the video to take the thumbnail
                </p>
              </div>

              <div className="flex items-center gap-1.5 rounded-[8px] border border-black/[0.08] dark:border-white/[0.1] bg-[#f5f5f7] dark:bg-[#1c1c1e] px-2.5 py-1.5">
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={percent === 0 ? "" : percent}
                  onChange={handlePercentChange}
                  onBlur={handlePercentBlur}
                  disabled={loading}
                  className="w-10 bg-transparent text-[13px] text-[#1d1d1f] dark:text-[#f5f5f7] text-right outline-none disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="text-[13px] text-[#86868b]">%</span>
              </div>
            </div>

            <div className="px-4 py-3.5 border-b border-black/[0.06] dark:border-white/[0.08]">
              <p className="text-[13px] font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">
                Database URL
              </p>
              <p className="text-[12px] text-[#86868b] dark:text-[#98989d] mb-2">
                Connection string for your PostgreSQL database
              </p>
              <input
                type="text"
                value={db}
                onChange={(e) => setDb(e.target.value)}
                disabled={loading}
                placeholder="postgres://user:password@localhost:5432/kura"
                className="w-full rounded-[8px] border border-black/[0.08] dark:border-white/[0.1] bg-[#f5f5f7] dark:bg-[#1c1c1e] px-3 py-2 text-[13px] text-[#1d1d1f] dark:text-[#f5f5f7] outline-none placeholder:text-[#86868b] focus:ring-2 focus:ring-[#007AFF]/40 disabled:opacity-50"
              />
              {db.trim().length > 0 && !dbUrlLooksValid && (
                <p className="mt-1.5 text-[11px] text-[#FF9500] dark:text-[#FF9F0A]">
                  This should be a postgres:// connection string
                </p>
              )}
            </div>

            <div className="px-4 py-3.5 flex items-center justify-between">
              <p className="text-[11px] text-[#86868b] dark:text-[#98989d]">
                {configured
                  ? "Thumbnails are set up. Update and re-run setup to apply changes."
                  : "Nothing is saved until you run setup."}
              </p>

              <button
                type="button"
                onClick={handleSetup}
                disabled={!canSetUp}
                className="shrink-0 rounded-[8px] bg-[#007AFF] dark:bg-[#0A84FF] px-3.5 py-1.5 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:bg-[#e5e5ea] dark:disabled:bg-[#3a3a3c] disabled:text-[#86868b] cursor-pointer"
              >
                {loading ? `${STAGES[stageIndex]}…` : "Set up"}
              </button>
            </div>
          </>
        )}
      </div>

      {error && (
        <p className="mt-3 text-[12px] text-[#FF3B30] dark:text-[#FF453A]">
          {error}
        </p>
      )}
      {justSaved && (
        <p className="mt-3 text-[12px] text-[#007AFF] dark:text-[#0A84FF]">
          Thumbnail generation is ready to go.
        </p>
      )}
    </div>
  );
}
