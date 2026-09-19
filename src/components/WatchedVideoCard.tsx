import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { useState } from "react";
import { Link } from "react-router-dom";
import { VideoCard } from "../pages/Home";
import { formatDuration } from "../utils/files";
import { RotateCcw, Trash } from "lucide-react";

export function WatchedVideoCard({
  video,
  onRemove,
}: {
  video: VideoCard;
  onRemove: (videoId: string) => void;
}) {
  // Tracks which action is in flight (if any) so both buttons can be
  // disabled together — no reason to allow a restore while a trash is
  // still resolving for the same card.
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
    <div className="w-full overflow-hidden rounded-sm border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 transition-all hover:border-slate-300 dark:hover:border-neutral-600 hover:shadow-sm">
      <Link to={`/videos/${video.id}`}>
        <div className="relative">
          <Thumbnail path={video.thumbnail_path} title={video.title} />
          <span className="absolute bottom-1.5 right-1.5 rounded bg-black/70 px-1.5 py-0.5 text-xs font-medium text-white">
            {formatDuration(video.duration_seconds)}
          </span>
        </div>
      </Link>

      <div className="flex divide-x divide-slate-200 dark:divide-neutral-700 border-t border-slate-200 dark:border-neutral-700">
        <button
          type="button"
          onClick={handleRestore}
          disabled={pending !== null}
          className="flex flex-1 items-center justify-center gap-1.5 py-2 text-sm font-medium text-slate-600 dark:text-neutral-300 transition-colors hover:bg-slate-50 dark:hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
        >
          <RotateCcw className="h-4 w-4" />
          {pending === "restore" ? "Restoring…" : "Restore"}
        </button>

        <button
          type="button"
          onClick={handleTrash}
          disabled={pending !== null}
          className="flex flex-1 items-center justify-center gap-1.5 py-2 text-sm font-medium text-red-600 dark:text-red-400 transition-colors hover:bg-red-50 dark:hover:bg-red-950/40 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
        >
          <Trash className="h-4 w-4" />
          {pending === "trash" ? "Trashing…" : "Trash"}
        </button>
      </div>
    </div>
  );
}

function Thumbnail({ path, title }: { path: string | null; title: string }) {
  const [failed, setFailed] = useState(false);

  if (!path || failed) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-lg bg-slate-100 dark:bg-neutral-700">
        <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7 text-slate-300 dark:text-neutral-500">
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
      className="aspect-video w-full object-cover"
      onError={() => setFailed(true)}
    />
  );
}
