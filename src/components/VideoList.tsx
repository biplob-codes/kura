import { formatFileSize } from "../utils/files";
import type { Video } from "../pages/Video";
import { mediaUrl } from "./mediaUrl";

interface Props {
  folderName: string;
  videos: Video[];
  loading: boolean;
  selectedId: string;
  setSelectedId: (id: string) => void;
}

function formatDuration(seconds: number | null): string {
  if (seconds == null) return "--:--";
  const total = Math.round(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

function ListThumbnail({ video }: { video: Video }) {
  const src = mediaUrl(video.thumbnail_path);

  if (!src) {
    return (
      <span className="flex h-11 w-[78px] shrink-0 items-center justify-center rounded bg-white/5 text-white/25">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-4 w-4"
        >
          <path d="M8 5v14l11-7z" />
        </svg>
      </span>
    );
  }

  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      decoding="async"
      className="h-11 w-[78px] shrink-0 rounded object-cover"
    />
  );
}

const VideoList = ({
  folderName,
  videos,
  loading,
  selectedId,
  setSelectedId,
}: Props) => {
  return (
    <div className="flex w-[340px] shrink-0 flex-col min-h-0">
      <div className="shrink-0 px-2 mb-3">
        <h2 className="truncate font-semibold text-white/90">
          {folderName || "Files"}
        </h2>
        <p className="mt-0.5 text-sm text-white/40">
          {videos.length} {videos.length === 1 ? "video" : "videos"}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <p className="px-4 py-3 text-sm text-white/40">Loading videos…</p>
        ) : videos.length === 0 ? (
          <p className="px-4 py-3 text-sm text-white/40">No videos found.</p>
        ) : (
          <ul>
            {videos.map((video) => {
              const isSelected = video.id === selectedId;
              return (
                <li key={video.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(video.id)}
                    className={[
                      "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors cursor-pointer",
                      isSelected ? "bg-white/10" : "hover:bg-white/5",
                    ].join(" ")}
                  >
                    <ListThumbnail video={video} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <p
                          className={[
                            "truncate text-sm",
                            isSelected
                              ? "font-medium text-white"
                              : "text-white/75",
                          ].join(" ")}
                        >
                          {video.title}
                        </p>
                        {!video.watched && (
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-white/80" />
                        )}
                      </span>
                      <p className="mt-0.5 truncate text-xs text-white/40">
                        {formatDuration(video.duration_seconds)} ·{" "}
                        {formatFileSize(video.size_bytes)}
                      </p>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default VideoList;
