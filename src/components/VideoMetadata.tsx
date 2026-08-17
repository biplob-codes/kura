import { formatFileSize } from "../utils/files";
import type { Video } from "../pages/Video";

interface Props {
  video?: Video;
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

const VideoMetadata = ({ video }: Props) => {
  return (
    <div className="shrink-0 rounded-lg border border-neutral-200 bg-white px-6 py-4">
      {video ? (
        <>
          <div className="flex items-center gap-2">
            <h1 className="truncate text-base font-semibold text-neutral-900">
              {video.title}
            </h1>
            {!video.watched && (
              <span className="shrink-0 rounded-full bg-neutral-900 px-2 py-0.5 text-[10px] font-medium text-white">
                Unwatched
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-neutral-400">
            {formatDuration(video.duration_seconds)} &middot;{" "}
            {formatFileSize(video.size_bytes)}
            {video.width && video.height && (
              <>
                {" "}
                &middot; {video.width}&times;{video.height}
              </>
            )}
          </p>
        </>
      ) : (
        <>
          <h1 className="text-base font-semibold text-neutral-300">
            No video selected
          </h1>
          <p className="mt-1 text-sm text-neutral-300">— &middot; —</p>
        </>
      )}
    </div>
  );
};

export default VideoMetadata;
