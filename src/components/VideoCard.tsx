import { invoke } from "@tauri-apps/api/core";
import { useState } from "react";
import { VideoCard } from "../pages/Home";
import { formatDuration } from "../utils/files";
import { mediaUrl } from "./mediaUrl";

export function VideoCardItem({ video }: { video: VideoCard }) {
  const [inWatchlist, setInWatchlist] = useState(video.in_watchlist);
  const [updating, setUpdating] = useState(false);
  const [playError, setPlayError] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);

  async function toggleWatchlist(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (updating) return;
    const next = !inWatchlist;
    setUpdating(true);
    try {
      await invoke("set_video_watchlist", {
        videoId: video.id,
        inWatchlist: next,
      });
      setInWatchlist(next);
    } catch (err) {
      console.error("Couldn't update watchlist:", err);
    } finally {
      setUpdating(false);
    }
  }

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

          <button
            type="button"
            onClick={toggleWatchlist}
            disabled={updating}
            title={inWatchlist ? "Remove from watchlist" : "Add to watchlist"}
            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70 disabled:opacity-60 cursor-pointer"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-3.5 w-3.5"
              fill={inWatchlist ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                d="M6 3.5h12a.5.5 0 01.5.5v16.2a.4.4 0 01-.63.33L12 16.2l-5.87 4.33a.4.4 0 01-.63-.33V4a.5.5 0 01.5-.5z"
                strokeLinejoin="round"
              />
            </svg>
          </button>

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
