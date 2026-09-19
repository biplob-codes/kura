import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { VideoCard } from "./Home";
import { CardSkeleton, VideoCardItem } from "../components/VideoCard";

export default function Watchlist() {
  const [videos, setVideos] = useState<VideoCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    invoke<VideoCard[]>("get_watchlist_videos")
      .then((res) => {
        if (!cancelled) setVideos(res);
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
  }, []);

  if (error) {
    return (
      <div className="p-8">
        <div className="rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-6 text-sm text-slate-500 dark:text-neutral-400">
          <p className="font-medium text-slate-700 dark:text-neutral-200">
            Couldn't load your watchlist
          </p>
          <p className="mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5">
      {!loading && videos.length === 0 ? (
        <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-slate-200 dark:border-neutral-700 text-sm text-slate-400 dark:text-neutral-500">
          Nothing in your watchlist yet
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
