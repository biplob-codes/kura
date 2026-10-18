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
    <div className="group block">
      <Link to={`/videos/${video.id}`}>
        <div className="relative aspect-video w-full overflow-hidden rounded-md bg-neutral-800">
          <Thumbnail path={video.thumbnail_path} title={video.title} />
          <span className="absolute bottom-1.5 right-1.5 rounded bg-black/65 px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-white">
            {formatDuration(video.duration_seconds)}
          </span>
        </div>
      </Link>

      <div className="mt-2 px-0.5">
        <p
          className="truncate text-center text-[13px] font-medium text-white/90"
          title={video.title}
        >
          {video.title}
        </p>
      </div>

      <div className="mt-2 flex gap-1.5">
        <button
          type="button"
          onClick={handleRestore}
          disabled={pending !== null}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-white/5 py-1.5 text-[12px] font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50 cursor-pointer"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          {pending === "restore" ? "Restoring…" : "Restore"}
        </button>

        <button
          type="button"
          onClick={handleTrash}
          disabled={pending !== null}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-white/5 py-1.5 text-[12px] font-medium text-red-400/90 transition-colors hover:bg-red-500/15 hover:text-red-300 disabled:opacity-50 cursor-pointer"
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
