import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/video.css";

import { MediaPlayer, MediaProvider } from "@vidstack/react";
import {
  defaultLayoutIcons,
  DefaultVideoLayout,
} from "@vidstack/react/player/layouts/default";
import type { VideoMimeType } from "@vidstack/react";

interface Props {
  path: string;
}

const VIDEO_SERVER_URL = "http://127.0.0.1:8000/video";

function buildStreamUrl(path: string): string {
  return `${VIDEO_SERVER_URL}?path=${encodeURIComponent(path)}`;
}

function guessMimeType(path: string): VideoMimeType {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  switch (ext) {
    case "mp4":
    case "m4v":
      return "video/mp4";
    case "webm":
      return "video/webm";
    case "ogg":
    case "ogv":
      return "video/ogg";
    case "mov":
      // quicktime is not in the union; fall back to mp4
      return "video/mp4";
    case "mkv":
    case "avi":
    default:
      return "video/mp4";
  }
}

const VideoPlayer = ({ path }: Props) => {
  if (!path) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-black text-white/30">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.25}
          className="h-12 w-12"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 10.5l4.72-2.72a.75.75 0 011.13.65v8.14a.75.75 0 01-1.13.65l-4.72-2.72M4.5 6.75h9a1.5 1.5 0 011.5 1.5v7.5a1.5 1.5 0 01-1.5 1.5h-9a1.5 1.5 0 01-1.5-1.5v-7.5a1.5 1.5 0 011.5-1.5z"
          />
        </svg>
        <p className="text-[13px] text-white/40">No video selected</p>
      </div>
    );
  }

  const src = buildStreamUrl(path);
  const type = guessMimeType(path);

  return (
    <div className="h-full w-full overflow-hidden bg-black">
      <MediaPlayer
        src={{ src, type }}
        className="h-full w-full"
        playsInline
        autoPlay
        preload="metadata"
      >
        <MediaProvider />
        <DefaultVideoLayout icons={defaultLayoutIcons} />
      </MediaPlayer>
    </div>
  );
};

export default VideoPlayer;
