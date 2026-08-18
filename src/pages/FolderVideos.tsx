import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import { VideoCard } from "./Home";
import { VideoCardItem } from "../components/VideoCard";

interface FolderVideosResponse {
  folder_name: string;
  videos: VideoCard[];
}

function CardSkeleton() {
  return (
    <div className="w-full animate-pulse rounded-xl border border-slate-200 bg-white p-2.5">
      <div className="aspect-video w-full rounded-lg bg-slate-100" />
      <div className="mt-2 space-y-1.5 px-0.5">
        <div className="h-3.5 w-4/5 rounded bg-slate-100" />
        <div className="h-3 w-1/3 rounded bg-slate-100" />
      </div>
    </div>
  );
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
      <div className="p-8">
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
          <p className="font-medium text-slate-700">
            Couldn't load this folder
          </p>
          <p className="mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-2 pb-7 px-4">
      {loading ? (
        <div className="mb-5 h-6 w-40 animate-pulse rounded bg-slate-100" />
      ) : (
        <div className="flex justify-between items-center mb-5">
          <h1 className="text-lg font-semibold text-slate-800">{folderName}</h1>
          <p className="text-lg font-semibold text-slate-800">
            {videos.length} Videos
          </p>
        </div>
      )}

      {!loading && videos.length === 0 ? (
        <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-slate-200 text-sm text-slate-400">
          No videos in this folder yet
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {loading
            ? Array.from({ length: 10 }).map((_, i) => <CardSkeleton key={i} />)
            : videos.map((video) => (
                <VideoCardItem key={video.id} video={video} />
              ))}
        </div>
      )}
    </div>
  );
}
