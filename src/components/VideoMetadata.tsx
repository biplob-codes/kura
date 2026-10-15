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
    <div className="px-5 py-4">
      {video ? (
        <>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold text-white/95">
                {video.title}
              </h1>
              <p className="mt-1 text-sm text-white/45">
                {formatDuration(video.duration_seconds)} ·{" "}
                {formatFileSize(video.size_bytes)}
                {video.width && video.height && (
                  <>
                    {" "}
                    · {video.width}×{video.height}
                  </>
                )}
              </p>
            </div>

            <button
              type="button"
              onClick={toggleWatched}
              disabled={updating}
              className={[
                "shrink-0 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer",
                video.watched
                  ? "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/80"
                  : "bg-white text-black hover:bg-white/90",
              ].join(" ")}
            >
              {updating
                ? "Updating…"
                : video.watched
                  ? "Mark as unwatched"
                  : "Mark as watched"}
            </button>
          </div>

          {hasMeta && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {models.map((model) => (
                <span
                  key={`model-${model.id}`}
                  title={`Model: ${model.name}`}
                  className="inline-flex items-center gap-1 rounded-md bg-white/5 px-2 py-1 text-xs text-white/70"
                >
                  <User
                    size={12}
                    strokeWidth={2}
                    className="shrink-0 text-white/40"
                  />
                  {model.name}
                </span>
              ))}
              {tags.map((tag) => (
                <span
                  key={`tag-${tag.id}`}
                  title={`Tag: ${tag.name}`}
                  className="inline-flex items-center gap-1 rounded-md bg-white/5 px-2 py-1 text-xs text-white/70"
                >
                  <TagIcon
                    size={12}
                    strokeWidth={2}
                    className="shrink-0 text-white/40"
                  />
                  {tag.name}
                </span>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <h1 className="text-base font-semibold text-white/30">
            No video selected
          </h1>
          <p className="mt-1 text-sm text-white/25">— · —</p>
        </>
      )}
    </div>
  );
};

export default VideoMetadata;
