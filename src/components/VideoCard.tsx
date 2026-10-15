import { invoke } from "@tauri-apps/api/core";
import { useState } from "react";
import { Link } from "react-router-dom";
import { VideoCard } from "../pages/Home";
import { formatDuration } from "../utils/files";
import { mediaUrl } from "./mediaUrl";

export function VideoCardItem({ video }: { video: VideoCard }) {
  const [inWatchlist, setInWatchlist] = useState(video.in_watchlist);
  const [updating, setUpdating] = useState(false);

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

  return (
    <Link to={`/videos/${video.id}`} className="block group">
      <div
        className="w-full text-left rounded-[10px] overflow-hidden bg-white dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_4px_12px_rgba(0,0,0,0.3)] transition-shadow duration-200"
        title={video.title}
      >
        <div className="relative">
          <Thumbnail path={video.thumbnail_path} title={video.title} />

          <button
            type="button"
            onClick={toggleWatchlist}
            disabled={updating}
            title={inWatchlist ? "Remove from watchlist" : "Add to watchlist"}
            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm text-white transition-colors hover:bg-black/70 disabled:opacity-60 cursor-pointer"
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

          <span className="absolute bottom-1.5 right-1.5 rounded-[4px] bg-black/65 backdrop-blur-sm px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-white">
            {formatDuration(video.duration_seconds)}
          </span>
        </div>

        <div className="px-2.5 py-2">
          <p className="truncate text-[13px] font-medium tracking-[-0.01em] text-[#1d1d1f] dark:text-[#f5f5f7]">
            {video.title}
          </p>
        </div>
      </div>
    </Link>
  );
}

function Thumbnail({ path, title }: { path: string | null; title: string }) {
  const [failed, setFailed] = useState(false);
  const src = mediaUrl(path);

  if (!src || failed) {
    return (
      <div className="flex aspect-video w-full items-center justify-center bg-[#f0f0f2] dark:bg-[#3a3a3c]">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="h-7 w-7 text-[#c7c7cc] dark:text-[#636366]"
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
      className="aspect-video w-full object-cover"
      onError={() => setFailed(true)}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="w-full animate-pulse rounded-[10px] overflow-hidden border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#2c2c2e]">
      <div className="aspect-video w-full bg-[#f0f0f2] dark:bg-[#3a3a3c]" />
      <div className="px-2.5 py-2">
        <div className="h-3.5 w-4/5 rounded bg-[#f0f0f2] dark:bg-[#3a3a3c]" />
      </div>
    </div>
  );
}
