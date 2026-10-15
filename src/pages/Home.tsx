import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { VideoSection } from "../components/VideoSection";

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

type SectionKey = keyof HomeVideos;

const SECTIONS: { key: SectionKey; title: string; description: string }[] = [
  {
    key: "recent",
    title: "Recent",
    description: "Latest additions to your library",
  },
  {
    key: "oldest",
    title: "Oldest",
    description: "Been sitting in your library the longest",
  },
  {
    key: "biggest",
    title: "Largest",
    description: "Taking up the most space on disk",
  },
  {
    key: "smallest",
    title: "Smallest",
    description: "Taking up the least space on disk",
  },
];

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
      <div className="p-6">
        <div className="rounded-[12px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#2c2c2e] p-5 text-[13px] text-[#86868b]">
          <p className="font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">
            Couldn't load your videos
          </p>
          <p className="mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7 pt-1 pb-8 px-5">
      <div className="sticky top-0 z-10 -mx-5 px-5 py-3 bg-[#f5f5f7]/85 dark:bg-[#1c1c1e]/85 backdrop-blur-xl border-b border-black/[0.04] dark:border-white/[0.06]">
        <h1 className="text-[22px] font-bold tracking-[-0.03em] text-[#1d1d1f] dark:text-[#f5f5f7]">
          Home
        </h1>
      </div>

      {SECTIONS.map(({ key, title, description }) => (
        <VideoSection
          key={key}
          title={title}
          description={description}
          videos={data?.[key] ?? []}
          loading={loading}
        />
      ))}
    </div>
  );
}
