import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { WatchedVideoCard } from "../components/WatchedVideoCard";
import { VideoCard } from "./Home";

interface WatchedGroup {
  date: string;
  videos: VideoCard[];
}

function formatDateLabel(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (sameDay(date, today)) return "Today";
  if (sameDay(date, yesterday)) return "Yesterday";

  return date.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function CardSkeleton() {
  return (
    <div className="w-full animate-pulse rounded-[10px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#2c2c2e] overflow-hidden">
      <div className="aspect-video w-full bg-[#f0f0f2] dark:bg-[#3a3a3c]" />
      <div className="h-9 border-t border-black/[0.06] dark:border-white/[0.08] bg-[#fafafa] dark:bg-[#2c2c2e]" />
    </div>
  );
}

function GroupSkeleton() {
  return (
    <section>
      <div className="mb-3 h-4 w-28 animate-pulse rounded bg-[#e8e8ed] dark:bg-[#3a3a3c]" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </section>
  );
}

export default function Watched() {
  const [groups, setGroups] = useState<WatchedGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    invoke<WatchedGroup[]>("get_watched_videos")
      .then((res) => {
        if (!cancelled) setGroups(res);
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

  function handleRemove(videoId: string) {
    setGroups((prev) =>
      prev
        .map((group) => ({
          ...group,
          videos: group.videos.filter((v) => v.id !== videoId),
        }))
        .filter((group) => group.videos.length > 0),
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-[12px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#2c2c2e] p-5 text-[13px] text-[#86868b]">
          <p className="font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">
            Couldn't load watched videos
          </p>
          <p className="mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 pb-8">
      <div className="sticky top-0 z-10 -mx-5 px-5 py-3 bg-[#f5f5f7]/85 dark:bg-[#1c1c1e]/85 backdrop-blur-xl border-b border-black/[0.04] dark:border-white/[0.06]">
        <h1 className="text-[22px] font-bold tracking-[-0.03em] text-[#1d1d1f] dark:text-[#f5f5f7]">
          Watched
        </h1>
      </div>

      <div className="mt-4 space-y-7">
        {loading ? (
          <>
            <GroupSkeleton />
            <GroupSkeleton />
          </>
        ) : groups.length === 0 ? (
          <div className="flex h-32 items-center justify-center rounded-[12px] border border-dashed border-black/[0.1] dark:border-white/[0.12] text-[13px] text-[#86868b]">
            No watched videos yet
          </div>
        ) : (
          groups.map((group) => (
            <section key={group.date}>
              <h2 className="mb-3 text-[13px] font-semibold tracking-[-0.01em] text-[#86868b] dark:text-[#98989d]">
                {formatDateLabel(group.date)}
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {group.videos.map((video) => (
                  <WatchedVideoCard
                    key={video.id}
                    video={video}
                    onRemove={handleRemove}
                  />
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
}
