import { convertFileSrc } from "@tauri-apps/api/core";
import { formatFileSize } from "../utils/files";
import type { Video } from "../pages/Video";

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
  if (!video.thumbnail_path) {
    return (
      <span className="flex h-9 w-14 shrink-0 items-center justify-center rounded bg-neutral-100 text-neutral-300">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-3.5 w-3.5"
        >
          <path d="M8 5v14l11-7z" />
        </svg>
      </span>
    );
  }

  return (
    <img
      src={convertFileSrc(video.thumbnail_path)}
      alt=""
      className="h-9 w-14 shrink-0 rounded object-cover"
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
    <div className="flex w-72 shrink-0 flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white">
      <div className="shrink-0 border-b border-neutral-200 px-5 py-4">
        <h2 className="truncate text-sm font-semibold text-neutral-900">
          {folderName || "Files"}
        </h2>
        <p className="mt-0.5 text-xs text-neutral-400">
          {videos.length} {videos.length === 1 ? "video" : "videos"}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <p className="px-5 py-4 text-sm text-neutral-400">Loading videos…</p>
        ) : videos.length === 0 ? (
          <p className="px-5 py-4 text-sm text-neutral-400">No videos found.</p>
        ) : (
          <ul>
            {videos.map((video) => {
              const isSelected = video.id === selectedId;
              return (
                <li key={video.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(video.id)}
                    className={`flex w-full items-center gap-3 px-5 py-3 text-left cursor-pointer transition-colors ${
                      isSelected ? "bg-neutral-100" : "hover:bg-neutral-50"
                    }`}
                  >
                    <ListThumbnail video={video} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <p
                          className={`truncate text-sm ${
                            isSelected
                              ? "font-medium text-neutral-900"
                              : "text-neutral-700"
                          }`}
                        >
                          {video.title}
                        </p>
                        {/* Small unwatched dot — only shown when relevant,
                            so a fully-watched folder isn't cluttered with
                            empty space where dots would otherwise sit. */}
                        {!video.watched && (
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-900" />
                        )}
                      </span>
                      <p className="mt-0.5 truncate text-xs text-neutral-400">
                        {formatDuration(video.duration_seconds)} &middot;{" "}
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
