import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import { ChevronDown, ChevronLeft, ChevronRight, Shuffle } from "lucide-react";
import { VideoCard } from "./Home";
import { CardSkeleton, VideoCardItem } from "../components/VideoCard";

interface FolderVideosResponse {
  folder_name: string;
  videos: VideoCard[];
}

type SortKey =
  | "newest"
  | "oldest"
  | "title-asc"
  | "title-desc"
  | "longest"
  | "shortest"
  | "largest"
  | "smallest";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "title-asc", label: "Title A–Z" },
  { value: "title-desc", label: "Title Z–A" },
  { value: "longest", label: "Longest" },
  { value: "shortest", label: "Shortest" },
  { value: "largest", label: "Largest" },
  { value: "smallest", label: "Smallest" },
];

const PAGE_SIZE = 20;

function sortVideos(videos: VideoCard[], key: SortKey): VideoCard[] {
  const list = [...videos];
  switch (key) {
    case "newest":
      return list.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    case "oldest":
      return list.sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );
    case "title-asc":
      return list.sort((a, b) =>
        a.title.localeCompare(b.title, undefined, { sensitivity: "base" }),
      );
    case "title-desc":
      return list.sort((a, b) =>
        b.title.localeCompare(a.title, undefined, { sensitivity: "base" }),
      );
    case "longest":
      return list.sort(
        (a, b) => (b.duration_seconds ?? 0) - (a.duration_seconds ?? 0),
      );
    case "shortest":
      return list.sort(
        (a, b) => (a.duration_seconds ?? 0) - (b.duration_seconds ?? 0),
      );
    case "largest":
      return list.sort((a, b) => b.size_bytes - a.size_bytes);
    case "smallest":
      return list.sort((a, b) => a.size_bytes - b.size_bytes);
    default:
      return list;
  }
}

export default function FolderVideos() {
  const { folderId } = useParams<{ folderId: string }>();
  const navigate = useNavigate();

  const [folderName, setFolderName] = useState<string | null>(null);
  const [videos, setVideos] = useState<VideoCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("newest");
  const [sortOpen, setSortOpen] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!folderId) {
      setError("No folder specified.");
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setPage(1);

    invoke<FolderVideosResponse>("get_folder_videos", { folderId })
      .then((result) => {
        if (cancelled) return;
        setFolderName(result.folder_name);
        setVideos(result.videos);
      })
      .catch((err) => {
        if (!cancelled) setError(String(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [folderId]);

  // Reset to first page whenever the sort changes
  useEffect(() => {
    setPage(1);
  }, [sortKey]);

  const sortedVideos = useMemo(
    () => sortVideos(videos, sortKey),
    [videos, sortKey],
  );

  const totalPages = Math.max(1, Math.ceil(sortedVideos.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const pageVideos = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return sortedVideos.slice(start, start + PAGE_SIZE);
  }, [sortedVideos, safePage]);

  const currentSortLabel =
    SORT_OPTIONS.find((o) => o.value === sortKey)?.label ?? "Newest";

  function playRandom() {
    if (sortedVideos.length === 0) return;
    const idx = Math.floor(Math.random() * sortedVideos.length);
    navigate(`/videos/${sortedVideos[idx].id}`);
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="rounded-xl bg-black/40 p-6 text-sm text-white/60">
          <p className="font-medium text-white/90">Couldn't load this folder</p>
          <p className="mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto px-5 pt-4 pb-8">
      {loading ? (
        <div className="mb-5 h-6 w-40 animate-pulse rounded bg-white/10" />
      ) : (
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-baseline gap-3">
            <h1 className="truncate text-lg font-semibold text-white/90">
              {folderName}
            </h1>
            <p className="shrink-0 text-sm text-white/50">
              {videos.length} {videos.length === 1 ? "video" : "videos"}
            </p>
          </div>

          {/* Controls */}
          {!loading && videos.length > 0 && (
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={playRandom}
                title="Play a random video"
                className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-sm text-white/80 transition-colors hover:bg-white/10"
              >
                <Shuffle className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Random</span>
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setSortOpen((o) => !o)}
                  className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-1.5 text-sm text-white/80 transition-colors hover:bg-white/10"
                >
                  <span>{currentSortLabel}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-white/40" />
                </button>

                {sortOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setSortOpen(false)}
                    />
                    <div className="absolute right-0 top-full z-20 mt-1 min-w-[140px] overflow-hidden rounded-lg bg-neutral-900 py-1 shadow-xl ring-1 ring-white/10">
                      {SORT_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            setSortKey(opt.value);
                            setSortOpen(false);
                          }}
                          className={[
                            "w-full px-3 py-2 text-left text-sm transition-colors",
                            sortKey === opt.value
                              ? "bg-white/10 font-medium text-white"
                              : "text-white/70 hover:bg-white/5 hover:text-white",
                          ].join(" ")}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {!loading && videos.length === 0 ? (
        <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-white/10 text-sm text-white/40">
          No videos in this folder yet
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {loading
              ? Array.from({ length: 12 }).map((_, i) => (
                  <CardSkeleton key={i} />
                ))
              : pageVideos.map((video) => (
                  <VideoCardItem key={video.id} video={video} />
                ))}
          </div>

          {/* Pagination */}
          {!loading && sortedVideos.length > PAGE_SIZE && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-white/80 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <span className="min-w-[80px] text-center text-sm tabular-nums text-white/60">
                {safePage} / {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-white/80 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
