import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { VideoCard } from "../pages/Home";
import { formatDuration, formatFileSize } from "../utils/files";
import { DEFAULT_THUMBNAIL, thumbnailSrc } from "./mediaUrl";

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
          <p className="mt-0.5 truncate text-center text-[11px] text-white/45">
            {formatFileSize(video.size_bytes)}
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
  const src = failed ? DEFAULT_THUMBNAIL : thumbnailSrc(path);

  useEffect(() => {
    setFailed(false);
  }, [path]);

  return (
    <img
      src={src}
      alt={title}
      className="aspect-video w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
      onError={() => {
        if (!failed) setFailed(true);
      }}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="block">
      <div className="aspect-video w-full animate-pulse rounded-lg bg-neutral-800" />
      <div className="mt-2 px-0.5 space-y-1">
        <div className="mx-auto h-3.5 w-4/5 rounded bg-neutral-800" />
        <div className="mx-auto h-3 w-1/3 rounded bg-neutral-800" />
      </div>
    </div>
  );
}
