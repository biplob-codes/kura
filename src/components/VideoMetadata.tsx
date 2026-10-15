import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Tag as TagIcon, User } from "lucide-react";
import { formatFileSize, formatDuration } from "../utils/files";
import type { Video } from "../pages/Video";

interface Props {
  video?: Video;
  onWatchedChange: (videoId: string, watched: boolean) => void;
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
    <div className="rounded-[12px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#2c2c2e] px-4 py-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      {video ? (
        <>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="truncate text-[15px] font-semibold tracking-[-0.02em] text-[#1d1d1f] dark:text-[#f5f5f7]">
                {video.title}
              </h1>
              <p className="mt-1 text-[12px] text-[#86868b] dark:text-[#98989d]">
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
              className={`shrink-0 whitespace-nowrap rounded-[8px] px-3.5 py-2 text-[13px] font-medium transition-colors disabled:opacity-50 cursor-pointer ${
                video.watched
                  ? "border border-black/[0.08] dark:border-white/[0.1] text-[#86868b] hover:bg-[#f5f5f7] dark:hover:bg-[#3a3a3c]"
                  : "bg-[#007AFF] dark:bg-[#0A84FF] text-white hover:opacity-90"
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
            <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-black/[0.06] dark:border-white/[0.08] pt-3">
              {models.map((model) => (
                <span
                  key={`model-${model.id}`}
                  title={`Model: ${model.name}`}
                  className="inline-flex items-center gap-1 rounded-full bg-[#f0f0f2] dark:bg-[#3a3a3c] px-2.5 py-1 text-[12px] text-[#1d1d1f] dark:text-[#f5f5f7]"
                >
                  <User
                    size={12}
                    strokeWidth={2}
                    className="shrink-0 text-[#86868b]"
                  />
                  {model.name}
                </span>
              ))}
              {tags.map((tag) => (
                <span
                  key={`tag-${tag.id}`}
                  title={`Tag: ${tag.name}`}
                  className="inline-flex items-center gap-1 rounded-full bg-[#f0f0f2] dark:bg-[#3a3a3c] px-2.5 py-1 text-[12px] text-[#1d1d1f] dark:text-[#f5f5f7]"
                >
                  <TagIcon
                    size={12}
                    strokeWidth={2}
                    className="shrink-0 text-[#86868b]"
                  />
                  {tag.name}
                </span>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <h1 className="text-[15px] font-semibold text-[#c7c7cc] dark:text-[#636366]">
            No video selected
          </h1>
          <p className="mt-1 text-[12px] text-[#c7c7cc] dark:text-[#636366]">
            — · —
          </p>
        </>
      )}
    </div>
  );
};

export default VideoMetadata;
