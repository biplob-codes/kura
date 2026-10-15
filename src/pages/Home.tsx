import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { HeroCarousel } from "../components/HeroCarousel";

export interface VideoCard {
  id: string;
  title: string;
  thumbnail_path: string | null;
  duration_seconds: number | null;
  size_bytes: number;
  created_at: string;
  in_watchlist: boolean;
}

interface HomeVideos {
  recent: VideoCard[];
  oldest: VideoCard[];
  biggest: VideoCard[];
  smallest: VideoCard[];
}

export default function Home() {
  const [data, setData] = useState<HomeVideos | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    invoke<HomeVideos>("get_home_videos")
      .then((result) => {
        if (!cancelled) setData(result);
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
      <div className="flex h-full items-center justify-center p-8">
        <div className="rounded-xl border border-neutral-700 bg-neutral-800 p-6 text-sm text-neutral-400">
          <p className="font-medium text-neutral-200">
            Couldn't load your videos
          </p>
          <p className="mt-1">{error}</p>
        </div>
      </div>
    );
  }

  const recent = data?.recent ?? [];

  // Full height of the main content area
  return (
    <div className="h-full w-full">
      <HeroCarousel videos={recent} loading={loading} />
    </div>
  );
}
