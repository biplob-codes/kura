import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { formatFileSize } from "../utils/files";
import type { Video } from "../pages/Video";

interface Props {
  video?: Video;
  onWatchedChange: (videoId: string, watched: boolean) => void;
}

function formatDuration(seconds: number | null): string {
  if (seconds == null) return "unknown length";
  const total = Math.round(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

const VideoMetadata = ({ video, onWatchedChange }: Props) => {
  const [updating, setUpdating] = useState(false);

  async function toggleWatched() {
    if (!video || updating) return;
    const next = !video.watched;

    setUpdating(true);
    try {
      await invoke("set_video_watched", { videoId: video.id, watched: next });
      // Update parent state only after the write actually succeeds — an
      // optimistic update here would leave the UI showing "watched" even
      // if the backend call failed.
      onWatchedChange(video.id, next);
    } catch (err) {
      console.error("Couldn't update watched status:", err);
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="shrink-0 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-6 py-4">
      {video ? (
        <>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold text-neutral-900 dark:text-neutral-100">
                {video.title}
              </h1>
              <p className="mt-1 text-sm text-neutral-400 dark:text-neutral-500">
                {formatDuration(video.duration_seconds)} &middot;{" "}
                {formatFileSize(video.size_bytes)}
                {video.width && video.height && (
                  <>
                    {" "}
                    &middot; {video.width}&times;{video.height}
                  </>
                )}
              </p>
            </div>

            <button
              type="button"
              onClick={toggleWatched}
              disabled={updating}
              className={`shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                video.watched
                  ? "border border-neutral-200 dark:border-neutral-600 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-700"
                  : "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200"
              }`}
            >
              {updating
                ? "Updating…"
                : video.watched
                  ? "Mark as unwatched"
                  : "Mark as watched"}
            </button>
          </div>

          {video.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {video.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="rounded-full bg-neutral-100 dark:bg-neutral-700 px-2.5 py-0.5 text-xs text-neutral-600 dark:text-neutral-300"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <h1 className="text-base font-semibold text-neutral-300 dark:text-neutral-600">
            No video selected
          </h1>
          <p className="mt-1 text-sm text-neutral-300 dark:text-neutral-600">— &middot; —</p>
        </>
      )}
    </div>
  );
};

export default VideoMetadata;
