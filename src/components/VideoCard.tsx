import { convertFileSrc } from "@tauri-apps/api/core";
import { useState } from "react";
import { VideoCard } from "../pages/Home";
import { formatDuration } from "../utils/files";

export function VideoCardItem({ video }: { video: VideoCard }) {
  return (
    <button
      className="group w-full rounded-sm border border-slate-200 bg-white text-left transition-all hover:border-slate-300 hover:shadow-sm"
      title={video.title}
    >
      <div className="relative">
        <Thumbnail path={video.thumbnail_path} title={video.title} />
        <span className="absolute bottom-1.5 right-1.5 rounded bg-black/70 px-1.5 py-0.5 text-xs font-medium text-white">
          {formatDuration(video.duration_seconds)}
        </span>
      </div>
    </button>
  );
}
function Thumbnail({ path, title }: { path: string | null; title: string }) {
  const [failed, setFailed] = useState(false);

  if (!path || failed) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-lg bg-slate-100">
        <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7 text-slate-300">
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
      src={convertFileSrc(path)}
      alt={title}
      className="aspect-video w-full rounded-sm object-cover cursor-pointer"
      onError={() => setFailed(true)}
    />
  );
}
export function CardSkeleton() {
  return (
    <div className="w-full animate-pulse rounded-xl border border-slate-200 bg-white p-2.5">
      <div className="aspect-video w-full rounded-lg bg-slate-100" />
      <div className="mt-2 space-y-1.5 px-0.5">
        <div className="h-3.5 w-4/5 rounded bg-slate-100" />
        <div className="h-3 w-1/3 rounded bg-slate-100" />
      </div>
    </div>
  );
}
