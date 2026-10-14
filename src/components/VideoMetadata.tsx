import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Tag as TagIcon, User } from "lucide-react";
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
      onWatchedChange(video.id, next);
    } catch (err) {
      console.error("Couldn't update watched status:", err);
    } finally {
      setUpdating(false);
    }
  }

  const models = video?.models ?? [];
  const tags = video?.tags ?? [];
  const hasMeta = models.length > 0 || tags.length > 0;

  return (
    <div className="rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-3">
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
              className={`shrink-0 whitespace-nowrap rounded-md px-4 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
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

          {hasMeta && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-neutral-100 dark:border-neutral-700 pt-3">
              {models.map((model) => (
                <span
                  key={`model-${model.id}`}
                  title={`Model: ${model.name}`}
                  className="inline-flex items-center gap-1 rounded-md border border-neutral-200 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-700 px-2 py-1 text-xs text-neutral-700 dark:text-neutral-200"
                >
                  <User
                    size={12}
                    strokeWidth={2}
                    className="shrink-0 text-neutral-500 dark:text-neutral-400"
                  />
                  {model.name}
                </span>
              ))}
              {tags.map((tag) => (
                <span
                  key={`tag-${tag.id}`}
                  title={`Tag: ${tag.name}`}
                  className="inline-flex items-center gap-1 rounded-md border border-neutral-200 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-700 px-2 py-1 text-xs text-neutral-700 dark:text-neutral-200"
                >
                  <TagIcon
                    size={12}
                    strokeWidth={2}
                    className="shrink-0 text-neutral-500 dark:text-neutral-400"
                  />
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
          <p className="mt-1 text-sm text-neutral-300 dark:text-neutral-600">
            — &middot; —
          </p>
        </>
      )}
    </div>
  );
};

export default VideoMetadata;
