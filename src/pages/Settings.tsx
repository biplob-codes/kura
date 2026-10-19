import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { ChevronDown } from "lucide-react";
import FolderSetup from "../components/FolderSetup";
import ThumbnailSettings from "../components/ThumbnailSettings";
import PasswordSettings from "../components/PasswordSettings";
import { useTheme, type Theme } from "../theme";

export interface AppConfig {
  inbox: string;
  library: string;
  use_thumbnails: boolean;
  thumbnail_percent: number;
  database_url: string;
  password_hash?: string;
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

  if (!config) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-white/50">Loading settings…</p>
      </div>
    );
  }

  const currentLabel =
    themeOptions.find((o) => o.value === theme)?.label ?? "System";

  return (
    <div className="h-full overflow-y-auto px-6 py-6">
      <div className="mx-auto w-full max-w-2xl space-y-8">
        {/* Theme */}
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[15px] font-medium text-white/90">Theme</p>
            <p className="mt-0.5 text-sm text-white/45">
              Light, dark, or match your system
            </p>
          </div>

          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setThemeOpen((o) => !o)}
              className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-sm text-white/80 transition-colors hover:bg-white/10"
            >
              <span>{currentLabel}</span>
              <ChevronDown className="h-3.5 w-3.5 text-white/40" />
            </button>

            {themeOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setThemeOpen(false)}
                />
                <div className="absolute right-0 top-full z-20 mt-1 min-w-[130px] overflow-hidden rounded-lg bg-neutral-900 py-1 shadow-xl ring-1 ring-white/10">
                  {themeOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setTheme(opt.value);
                        setThemeOpen(false);
                      }}
                      className={[
                        "w-full px-3 py-2 text-left text-sm transition-colors",
                        theme === opt.value
                          ? "bg-white/10 text-white font-medium"
                          : "text-white/70 hover:bg-white/5 hover:text-white",
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

        {/* Password */}
        <PasswordSettings />

        {/* Folders */}
        <FolderSetup inbox={config.inbox} library={config.library} />

        {/* Thumbnails */}
        <ThumbnailSettings
          databaseUrl={config.database_url}
          thumbnailPercent={config.thumbnail_percent}
          useThumbnails={config.use_thumbnails}
        />
      </div>
    </div>
  );
};

export default Settings;
