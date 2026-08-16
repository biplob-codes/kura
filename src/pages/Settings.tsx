import { useEffect, useState } from "react";
import FolderSetup from "../components/FolderSetup";
import ThumbnailSettings from "../components/ThumbnailSettings";
import { invoke } from "@tauri-apps/api/core";
export interface AppConfig {
  inbox: string;
  library: string;
  generate_thumbnails: boolean;
  thumbnail_percent: number;
}
const Settings = () => {
  const [config, setConfig] = useState<AppConfig | null>(null);

  useEffect(() => {
    invoke<AppConfig>("get_config").then(setConfig);
  }, []);
  return (
    <div className="w-full max-w-4xl mx-auto py-5">
      <h1 className="text-base font-semibold text-gray-900">
        Set up your folders
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        Choose where kura should look for new videos, and where sorted videos
        should live.
      </p>

      <FolderSetup />
      {config && (
        <ThumbnailSettings
          generateThumbnails={config.generate_thumbnails}
          thumbnailPercent={config.thumbnail_percent}
        />
      )}
    </div>
  );
};

export default Settings;
