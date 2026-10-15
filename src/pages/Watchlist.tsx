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
      <div className="p-6">
        <div className="rounded-[12px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#2c2c2e] p-5 text-[13px] text-[#86868b]">
          <p className="font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">
            Couldn't load your watchlist
          </p>
          <p className="mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 pb-8">
      <div className="sticky top-0 z-10 -mx-5 px-5 py-3 bg-[#f5f5f7]/85 dark:bg-[#1c1c1e]/85 backdrop-blur-xl border-b border-black/[0.04] dark:border-white/[0.06]">
        <div className="flex items-baseline justify-between">
          <h1 className="text-[22px] font-bold tracking-[-0.03em] text-[#1d1d1f] dark:text-[#f5f5f7]">
            Watchlist
          </h1>
          {!loading && (
            <span className="text-[12px] text-[#86868b] dark:text-[#98989d]">
              {videos.length} {videos.length === 1 ? "video" : "videos"}
            </span>
          )}
        </div>
      </div>

      {!loading && videos.length === 0 ? (
        <div className="mt-6 flex h-32 items-center justify-center rounded-[12px] border border-dashed border-black/[0.1] dark:border-white/[0.12] text-[13px] text-[#86868b]">
          Nothing in your watchlist yet
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
