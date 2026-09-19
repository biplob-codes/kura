import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { ChevronDown } from "lucide-react";
import FolderSetup from "../components/FolderSetup";
import ThumbnailSettings from "../components/ThumbnailSettings";
import { useTheme, type Theme } from "../theme";

export interface AppConfig {
  inbox: string;
  library: string;
  use_thumbnails: boolean;
  thumbnail_percent: number;
  database_url: string;
}

const themeOptions: { value: Theme; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

const Settings = () => {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const { theme, setTheme } = useTheme();
  const [themeOpen, setThemeOpen] = useState(false);

  useEffect(() => {
    invoke<AppConfig>("get_config").then(setConfig);
  }, []);

  if (!config)
    return <p className="text-2xl m-5 text-red-500 dark:text-red-400">Couldnt get config</p>;

  const currentLabel =
    themeOptions.find((o) => o.value === theme)?.label ?? "System";

  return (
    <div className="w-full max-w-4xl mx-auto py-5 px-5">
      {/* ── Appearance ── */}
      <h1 className="text-base font-semibold text-gray-900 dark:text-neutral-100">
        Appearance
      </h1>
      <p className="mt-1 text-sm text-gray-500 dark:text-neutral-400">
        Choose how Kura looks. System follows your OS preference.
      </p>

      <div className="mt-5 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800">
        <div className="flex items-center justify-between gap-4 px-4 py-3.5 relative">
          <div className="min-w-0">
            <div className="text-sm font-medium text-gray-900 dark:text-neutral-100">
              Theme
            </div>
            <div className="text-xs text-gray-500 dark:text-neutral-400">
              Light, dark, or match your system
            </div>
          </div>

          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setThemeOpen((o) => !o)}
              className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-neutral-600 bg-gray-100 dark:bg-neutral-700 hover:bg-gray-200 dark:hover:bg-neutral-600 transition-colors px-3 py-1.5 text-sm text-gray-700 dark:text-neutral-200"
            >
              <span>{currentLabel}</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 dark:text-neutral-500 shrink-0" />
            </button>

            {themeOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setThemeOpen(false)}
                />
                <div className="absolute right-0 top-full mt-1 z-20 min-w-[120px] rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 py-1 shadow-lg">
                  {themeOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setTheme(opt.value);
                        setThemeOpen(false);
                      }}
                      className={[
                        "w-full text-left px-3 py-1.5 text-sm transition-colors",
                        theme === opt.value
                          ? "bg-gray-100 dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 font-medium"
                          : "text-gray-700 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-700/60",
                      ].join(" ")}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Folders ── */}
      <h1 className="text-base font-semibold text-gray-900 dark:text-neutral-100 mt-8">
        Set up your folders
      </h1>
      <p className="mt-1 text-sm text-gray-500 dark:text-neutral-400">
        Choose where kura should look for new videos, and where sorted videos
        should live.
      </p>

      <FolderSetup inbox={config.inbox} library={config.library} />

      <ThumbnailSettings
        databaseUrl={config.database_url}
        thumbnailPercent={config.thumbnail_percent}
        useThumbnails={config.use_thumbnails}
      />
    </div>
  );
};

export default Settings;
