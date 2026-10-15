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
    return (
      <p className="text-[15px] m-5 text-[#FF3B30] dark:text-[#FF453A]">
        Couldn't get config
      </p>
    );

  const currentLabel =
    themeOptions.find((o) => o.value === theme)?.label ?? "System";

  return (
    <div className="w-full max-w-2xl mx-auto px-5 pb-10">
      <div className="sticky top-0 z-10 -mx-5 px-5 py-3 bg-[#f5f5f7]/85 dark:bg-[#1c1c1e]/85 backdrop-blur-xl border-b border-black/[0.04] dark:border-white/[0.06]">
        <h1 className="text-[22px] font-bold tracking-[-0.03em] text-[#1d1d1f] dark:text-[#f5f5f7]">
          Settings
        </h1>
      </div>

      <h2 className="mt-6 text-[13px] font-semibold uppercase tracking-wide text-[#86868b] dark:text-[#98989d]">
        Appearance
      </h2>
      <p className="mt-1 text-[13px] text-[#86868b] dark:text-[#98989d]">
        Choose how Kura looks. System follows your OS preference.
      </p>

      <div className="mt-3 rounded-[12px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#2c2c2e] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between gap-4 px-4 py-3.5 relative">
          <div className="min-w-0">
            <div className="text-[13px] font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">
              Theme
            </div>
            <div className="text-[12px] text-[#86868b] dark:text-[#98989d]">
              Light, dark, or match your system
            </div>
          </div>

          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setThemeOpen((o) => !o)}
              className="flex items-center gap-2 rounded-[8px] border border-black/[0.08] dark:border-white/[0.1] bg-[#f5f5f7] dark:bg-[#3a3a3c] hover:bg-[#e8e8ed] dark:hover:bg-[#48484a] transition-colors px-3 py-1.5 text-[13px] text-[#1d1d1f] dark:text-[#f5f5f7] cursor-pointer"
            >
              <span>{currentLabel}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#86868b] shrink-0" />
            </button>

            {themeOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setThemeOpen(false)}
                />
                <div className="absolute right-0 top-full mt-1 z-20 min-w-[130px] rounded-[10px] border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#2c2c2e] py-1 shadow-lg overflow-hidden">
                  {themeOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setTheme(opt.value);
                        setThemeOpen(false);
                      }}
                      className={[
                        "w-full text-left px-3 py-1.5 text-[13px] transition-colors cursor-pointer",
                        theme === opt.value
                          ? "bg-[#007AFF]/12 dark:bg-[#0A84FF]/20 text-[#007AFF] dark:text-[#0A84FF] font-medium"
                          : "text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-black/[0.04] dark:hover:bg-white/[0.06]",
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

      <h2 className="mt-8 text-[13px] font-semibold uppercase tracking-wide text-[#86868b] dark:text-[#98989d]">
        Folders
      </h2>
      <p className="mt-1 text-[13px] text-[#86868b] dark:text-[#98989d]">
        Choose where Kura looks for new videos, and where sorted videos live.
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
