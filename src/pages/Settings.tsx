import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import FolderSetup from "../components/FolderSetup";
import ThumbnailSettings from "../components/ThumbnailSettings";

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
  if (!config)
    return <p className="text-2xl m-5 text-red-500">Couldnt get config</p>;
  return (
    <div className="w-full max-w-4xl mx-auto py-5">
      <h1 className="text-base font-semibold text-gray-900">
        Set up your folders
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        Choose where kura should look for new videos, and where sorted videos
        should live.
      </p>

      <FolderSetup inbox={config.inbox} library={config.library} />

      <h1 className="text-base font-semibold text-gray-900 mt-6">
        Thumbnail generation
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        Choose whether kura should generate thumbnails during transfer, and at
        what point in the video the thumbnail should be captured.
      </p>
      <ThumbnailSettings
        generateThumbnails={config.generate_thumbnails}
        thumbnailPercent={config.thumbnail_percent}
      />
    </div>
  );
};

export default Settings;
