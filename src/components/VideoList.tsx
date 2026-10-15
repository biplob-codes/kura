import { formatFileSize, formatDuration } from "../utils/files";
import type { Video } from "../pages/Video";
import { mediaUrl } from "./mediaUrl";

interface Props {
  folderName: string;
  videos: Video[];
  loading: boolean;
  selectedId: string;
  setSelectedId: (id: string) => void;
}

function ListThumbnail({ video }: { video: Video }) {
  const src = mediaUrl(video.thumbnail_path);

  if (!src) {
    return (
      <span className="flex h-9 w-14 shrink-0 items-center justify-center rounded-[5px] bg-[#f0f0f2] dark:bg-[#3a3a3c] text-[#c7c7cc] dark:text-[#636366]">
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
      src={src}
      alt=""
      className="h-9 w-14 shrink-0 rounded-[5px] object-cover"
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
    <div className="flex w-[280px] shrink-0 flex-col overflow-hidden rounded-[12px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#2c2c2e] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="shrink-0 border-b border-black/[0.06] dark:border-white/[0.08] px-4 py-3">
        <h2 className="truncate text-[13px] font-semibold tracking-[-0.01em] text-[#1d1d1f] dark:text-[#f5f5f7]">
          {folderName || "Files"}
        </h2>
        <p className="mt-0.5 text-[11px] text-[#86868b] dark:text-[#98989d]">
          {videos.length} {videos.length === 1 ? "video" : "videos"}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <p className="px-4 py-4 text-[13px] text-[#86868b]">Loading…</p>
        ) : videos.length === 0 ? (
          <p className="px-4 py-4 text-[13px] text-[#86868b]">No videos found.</p>
        ) : (
          <ul>
            {videos.map((video) => {
              const isSelected = video.id === selectedId;
              return (
                <li key={video.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(video.id)}
                    className={`flex w-full items-center gap-3 px-3 py-2.5 text-left cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-[#007AFF]/12 dark:bg-[#0A84FF]/20"
                        : "hover:bg-black/[0.03] dark:hover:bg-white/[0.05]"
                    }`}
                  >
                    <ListThumbnail video={video} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <p
                          className={`truncate text-[13px] ${
                            isSelected
                              ? "font-semibold text-[#007AFF] dark:text-[#0A84FF]"
                              : "font-medium text-[#1d1d1f] dark:text-[#f5f5f7]"
                          }`}
                        >
                          {video.title}
                        </p>
                        {!video.watched && (
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#007AFF] dark:bg-[#0A84FF]" />
                        )}
                      </span>
                      <p className="mt-0.5 truncate text-[11px] text-[#86868b] dark:text-[#98989d]">
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
