import { invoke } from "@tauri-apps/api/core";
import { useState } from "react";
import { Link } from "react-router-dom";
import { RotateCcw, Trash } from "lucide-react";
import { VideoCard } from "../pages/Home";
import { formatDuration } from "../utils/files";
import { mediaUrl } from "./mediaUrl";

export function WatchedVideoCard({
  video,
  onRemove,
}: {
  video: VideoCard;
  onRemove: (videoId: string) => void;
}) {
  const [pending, setPending] = useState<"restore" | "trash" | null>(null);

  async function handleRestore(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (pending) return;
    setPending("restore");
    try {
      await invoke("set_video_watched", { videoId: video.id, watched: false });
      onRemove(video.id);
    } catch (err) {
      console.error("Couldn't restore video:", err);
    } finally {
      setPending(null);
    }
  }

  async function handleTrash(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (pending) return;
    setPending("trash");
    try {
      await invoke("move_video_to_trash", { videoId: video.id });
      onRemove(video.id);
    } catch (err) {
      console.error("Couldn't move video to trash:", err);
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="w-full overflow-hidden rounded-[10px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#2c2c2e] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-shadow hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
      <Link to={`/videos/${video.id}`}>
        <div className="relative">
          <Thumbnail path={video.thumbnail_path} title={video.title} />
          <span className="absolute bottom-1.5 right-1.5 rounded-[4px] bg-black/65 backdrop-blur-sm px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-white">
            {formatDuration(video.duration_seconds)}
          </span>
        </div>
      </Link>

      <div className="flex divide-x divide-black/[0.06] dark:divide-white/[0.08] border-t border-black/[0.06] dark:border-white/[0.08]">
        <button
          type="button"
          onClick={handleRestore}
          disabled={pending !== null}
          className="flex flex-1 items-center justify-center gap-1.5 py-2 text-[12px] font-medium text-[#007AFF] dark:text-[#0A84FF] transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.05] disabled:opacity-50 cursor-pointer"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          {pending === "restore" ? "Restoring…" : "Restore"}
        </button>

        <button
          type="button"
          onClick={handleTrash}
          disabled={pending !== null}
          className="flex flex-1 items-center justify-center gap-1.5 py-2 text-[12px] font-medium text-[#FF3B30] dark:text-[#FF453A] transition-colors hover:bg-[#FF3B30]/08 disabled:opacity-50 cursor-pointer"
        >
          <Trash className="h-3.5 w-3.5" />
          {pending === "trash" ? "Trashing…" : "Trash"}
        </button>
      </div>
    </div>
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
      loading="lazy"
      decoding="async"
      className="aspect-video w-full object-cover"
      onError={() => setFailed(true)}
    />
  );
}
