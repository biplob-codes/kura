import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import { VideoCard } from "./Home";
import { VideoCardItem, CardSkeleton } from "../components/VideoCard";

interface FolderVideosResponse {
  folder_name: string;
  videos: VideoCard[];
}

export default function FolderVideos() {
  const { folderId } = useParams<{ folderId: string }>();

  const [folderName, setFolderName] = useState<string | null>(null);
  const [videos, setVideos] = useState<VideoCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!folderId) {
      setError("No folder specified.");
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

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

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-[12px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#2c2c2e] p-5 text-[13px] text-[#86868b]">
          <p className="font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">
            Couldn't load this folder
          </p>
          <p className="mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 pb-8">
      <div className="sticky top-0 z-10 -mx-5 px-5 py-3 bg-[#f5f5f7]/85 dark:bg-[#1c1c1e]/85 backdrop-blur-xl border-b border-black/[0.04] dark:border-white/[0.06]">
        {loading ? (
          <div className="h-7 w-40 animate-pulse rounded bg-[#e8e8ed] dark:bg-[#3a3a3c]" />
        ) : (
          <div className="flex items-baseline justify-between">
            <h1 className="text-[22px] font-bold tracking-[-0.03em] text-[#1d1d1f] dark:text-[#f5f5f7]">
              {folderName}
            </h1>
            <p className="text-[12px] text-[#86868b] dark:text-[#98989d]">
              {videos.length} {videos.length === 1 ? "video" : "videos"}
            </p>
          </div>
        )}
      </div>

      {!loading && videos.length === 0 ? (
        <div className="mt-6 flex h-32 items-center justify-center rounded-[12px] border border-dashed border-black/[0.1] dark:border-white/[0.12] text-[13px] text-[#86868b]">
          No videos in this folder yet
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {loading
            ? Array.from({ length: 10 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))
            : videos.map((video) => (
                <VideoCardItem key={video.id} video={video} />
              ))}
        </div>
      )}
    </div>
  );
}
