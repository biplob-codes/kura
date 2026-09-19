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
    title: "Recent videos",
    description: "Latest additions to your library",
  },
  {
    key: "oldest",
    title: "Oldest videos",
    description: "Been sitting in your library the longest",
  },
  {
    key: "biggest",
    title: "Biggest videos",
    description: "Taking up the most space on disk",
  },
  {
    key: "smallest",
    title: "Smallest videos",
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
      <div className="p-8">
        <div className="rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-6 text-sm text-slate-500 dark:text-neutral-400">
          <p className="font-medium text-slate-700 dark:text-neutral-200">
            Couldn't load your videos
          </p>
          <p className="mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pt-2 pb-7 px-5">
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
