import { invoke } from "@tauri-apps/api/core";
import { useState } from "react";
import { VideoCard } from "../pages/Home";
import { formatDuration } from "../utils/files";
import { mediaUrl } from "./mediaUrl";

export function VideoCardItem({ video }: { video: VideoCard }) {
  const [playError, setPlayError] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);

  async function handlePlay() {
    if (playing) return;
    setPlayError(null);
    setPlaying(true);
    try {
      await invoke("play_video", { videoId: video.id });
    } catch (err) {
      setPlayError(String(err));
    } finally {
      setPlaying(false);
    }
  }

  return (
    <div className="group block">
      <button
        type="button"
        onClick={handlePlay}
        disabled={playing}
        className="w-full cursor-pointer text-left disabled:opacity-70"
      >
        <div className="relative aspect-video w-full overflow-hidden rounded-md bg-neutral-800">
          <Thumbnail path={video.thumbnail_path} title={video.title} />

          <span className="absolute bottom-1.5 right-1.5 rounded bg-black/65 px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-white">
            {formatDuration(video.duration_seconds)}
          </span>
        </div>

        <div className="mt-2 px-0.5">
          <p
            className="truncate text-center text-[13px] font-medium text-white/90"
            title={video.title}
          >
            {video.title}
          </p>
        </div>
      </button>

      {playError && (
        <p className="mt-1 px-0.5 text-center text-[11px] text-red-400/90">
          {playError}
        </p>
      )}
    </div>
  );
}

function Thumbnail({ path, title }: { path: string | null; title: string }) {
  const [failed, setFailed] = useState(false);
  const src = mediaUrl(path);

  if (!src || failed) {
    return (
      <div className="flex aspect-video w-full items-center justify-center bg-neutral-800">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="h-7 w-7 text-neutral-500"
        >
          <rect
            x="2.5"
            y="5.5"
            width="19"
            height="13"
            rx="2"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path d="M10 9.5l5 3-5 3v-6z" fill="currentColor" />
        </svg>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={title}
      className="aspect-video w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
      onError={() => setFailed(true)}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="block">
      <div className="aspect-video w-full animate-pulse rounded-lg bg-neutral-800" />
      <div className="mt-2 px-0.5">
        <div className="h-3.5 w-4/5 rounded bg-neutral-800" />
      </div>
    </div>
  );
}
