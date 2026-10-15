import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import { VideoCard } from "./Home";
import { CardSkeleton, VideoCardItem } from "../components/VideoCard";

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
        <div className="mb-5 flex items-baseline justify-between gap-3">
          <h1 className="text-lg font-semibold text-white/90">{folderName}</h1>
          <p className="text-sm text-white/50">
            {videos.length} {videos.length === 1 ? "video" : "videos"}
          </p>
        </div>
      )}

      {!loading && videos.length === 0 ? (
        <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-white/10 text-sm text-white/40">
          No videos in this folder yet
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {loading
            ? Array.from({ length: 12 }).map((_, i) => <CardSkeleton key={i} />)
            : videos.map((video) => (
                <VideoCardItem key={video.id} video={video} />
              ))}
        </div>
      )}
    </div>
  );
}
