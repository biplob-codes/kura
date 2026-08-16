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
    if (!next) {
      setJustSaved(false);
    }
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
      // thumbnails require the db, so they're switched on together
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
    <div className="w-full max-w-4xl mx-auto py-5">
      <h1 className="text-base font-semibold text-gray-900">
        Thumbnail generation
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        Automatically capture a thumbnail when videos are transferred. This
        needs ffmpeg installed on your system and a PostgreSQL database to store
        thumbnail records — set both up together below.
      </p>

      <div className="mt-4 rounded-xl border border-gray-200 bg-white overflow-hidden">
        {/* Switch row */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100">
          <div>
            <p className="text-sm font-medium text-gray-900">
              Enable thumbnail generation
            </p>
            <p className="text-sm text-gray-500">
              Requires ffmpeg and a connected PostgreSQL database
            </p>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            disabled={loading}
            onClick={handleToggle}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-60 ${
              enabled ? "bg-blue-500" : "bg-gray-200"
            }`}
          >
            <span
              className={`inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out ${
                enabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {/* Expanded fields, only when enabled */}
        {enabled && (
          <>
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Capture point
                </p>
                <p className="text-sm text-gray-500">
                  How far into the video kura should take the thumbnail
                </p>
              </div>

              <div className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5">
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={percent === 0 ? "" : percent}
                  onChange={handlePercentChange}
                  onBlur={handlePercentBlur}
                  disabled={loading}
                  className="w-10 bg-transparent text-sm text-gray-900 text-right outline-none disabled:text-gray-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="text-sm text-gray-500">%</span>
              </div>
            </div>

            <div className="px-4 py-3.5 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-900">Database URL</p>
              <p className="text-sm text-gray-500 mb-2">
                Connection string for your PostgreSQL database
              </p>
              <input
                type="text"
                value={db}
                onChange={(e) => setDb(e.target.value)}
                disabled={loading}
                placeholder="postgres://user:password@localhost:5432/kura"
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-400 focus:bg-white disabled:text-gray-400"
              />
              {db.trim().length > 0 && !dbUrlLooksValid && (
                <p className="mt-1.5 text-xs text-amber-600">
                  This should be a postgres:// connection string
                </p>
              )}
            </div>

            <div className="px-4 py-3.5 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                {configured
                  ? "Thumbnails are set up. Update and re-run setup to apply changes."
                  : "Nothing is saved until you run setup."}
              </p>

              <button
                type="button"
                onClick={handleSetup}
                disabled={!canSetUp}
                className="shrink-0 rounded-lg bg-blue-500 px-3.5 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400 cursor-pointer"
              >
                {loading ? `${STAGES[stageIndex]}…` : "Set up"}
              </button>
            </div>
          </>
        )}
      </div>

      {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
      {justSaved && (
        <p className="mt-3 text-xs text-blue-600">
          Thumbnail generation is ready to go.
        </p>
      )}
    </div>
  );
}
