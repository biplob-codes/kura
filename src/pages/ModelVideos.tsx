import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import { VideoCard } from "./Home";
import { VideoCardItem, CardSkeleton } from "../components/VideoCard";

interface ModelVideosResponse {
  model_name: string;
  videos: VideoCard[];
}

export default function ModelVideos() {
  const { modelId } = useParams<{ modelId: string }>();

  const [modelName, setModelName] = useState<string | null>(null);
  const [videos, setVideos] = useState<VideoCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!modelId) {
      setError("No model specified.");
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    invoke<ModelVideosResponse>("get_model_videos", { modelId })
      .then((result) => {
        if (cancelled) return;
        setModelName(result.model_name);
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
  }, [modelId]);

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-neutral-700 bg-neutral-900 p-6 text-sm text-neutral-400">
          <p className="font-medium text-neutral-200">
            Couldn't load this model
          </p>
          <p className="mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {loading ? (
        <div className="mb-6 h-6 w-40 animate-pulse rounded bg-neutral-800" />
      ) : (
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-white/90">{modelName}</h1>
          <p className="text-sm text-white/50">
            {videos.length} {videos.length === 1 ? "video" : "videos"}
          </p>
        </div>
      )}

      {!loading && videos.length === 0 ? (
        <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-neutral-700 text-sm text-neutral-500">
          No videos for this model yet
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-5 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)
            : videos.map((video) => (
                <VideoCardItem key={video.id} video={video} />
              ))}
        </div>
      )}
    </div>
  );
}
