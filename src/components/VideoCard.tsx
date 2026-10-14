import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { useState } from "react";
import { VideoCard } from "../pages/Home";
import { formatDuration } from "../utils/files";
import { Link } from "react-router-dom";

export function VideoCardItem({ video }: { video: VideoCard }) {
  const [inWatchlist, setInWatchlist] = useState(video.in_watchlist);
  const [updating, setUpdating] = useState(false);

  async function toggleWatchlist(e: React.MouseEvent) {
    // The whole card is wrapped in a <Link>, so without these the click
    // would both toggle the watchlist AND navigate to the video.
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

  return (
    <Link to={`/videos/${video.id}`}>
      <button
        className="group w-full rounded-sm border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-left transition-all hover:border-slate-300 dark:hover:border-neutral-600 hover:shadow-sm"
        title={video.title}
      >
        <div className="relative">
          <Thumbnail path={video.thumbnail_path} title={video.title} />

          <button
            type="button"
            onClick={toggleWatchlist}
            disabled={updating}
            title={inWatchlist ? "Remove from watchlist" : "Add to watchlist"}
            className="absolute right-1.5 top-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill={inWatchlist ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path
                d="M6 3.5h12a.5.5 0 01.5.5v16.2a.4.4 0 01-.63.33L12 16.2l-5.87 4.33a.4.4 0 01-.63-.33V4a.5.5 0 01.5-.5z"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <span className="absolute bottom-1.5 right-1.5 rounded bg-black/70 px-1.5 py-0.5 text-xs font-medium text-white">
            {formatDuration(video.duration_seconds)}
          </span>
        </div>
      </button>
    </Link>
  );
}

function thumbnailUrl(path: string | null): string | null {
  if (!path) return null;
  return `http://127.0.0.1:8000/thumbnail?path=${encodeURIComponent(path)}`;
}

function Thumbnail({ path, title }: { path: string | null; title: string }) {
  const [failed, setFailed] = useState(false);
  const src = thumbnailUrl(path);

  if (!src || failed) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-lg bg-slate-100 dark:bg-neutral-700">
        {/* ... same placeholder svg ... */}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={title}
      className="aspect-video w-full rounded-sm object-cover cursor-pointer"
      onError={() => setFailed(true)}
    />
  );
}
export function CardSkeleton() {
  return (
    <div className="w-full animate-pulse rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-2.5">
      <div className="aspect-video w-full rounded-lg bg-slate-100 dark:bg-neutral-700" />
      <div className="mt-2 space-y-1.5 px-0.5">
        <div className="h-3.5 w-4/5 rounded bg-slate-100 dark:bg-neutral-700" />
        <div className="h-3 w-1/3 rounded bg-slate-100 dark:bg-neutral-700" />
      </div>
    </div>
  );
}
