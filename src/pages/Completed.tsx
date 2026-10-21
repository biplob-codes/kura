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
    <div className="aspect-video w-full animate-pulse rounded-md bg-neutral-800" />
  );
}

function GroupSkeleton() {
  return (
    <section>
      <div className="mb-3 h-4 w-28 animate-pulse rounded bg-white/10" />
      <div className="grid grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </section>
  );
}

export default function Completed() {
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

  if (error) {
    return (
      <div className="h-full overflow-y-auto p-6">
        <div className="rounded-xl bg-black/40 p-6 text-sm text-white/60">
          <p className="font-medium text-white/90">
            Couldn't load completed videos
          </p>
          <p className="mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto px-5 pt-4 pb-8">
      <div className="mb-5 flex items-baseline justify-between gap-3">
        <h1 className="text-lg font-semibold text-white/90">Completed</h1>
      </div>

      <div className="space-y-7">
        {loading ? (
          <>
            <GroupSkeleton />
            <GroupSkeleton />
          </>
        ) : groups.length === 0 ? (
          <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-white/10 text-sm text-white/40">
            No completed videos yet
          </div>
        ) : (
          groups.map((group) => (
            <section key={group.date}>
              <h2 className="mb-3 text-[13px] font-semibold tracking-[-0.01em] text-white/50">
                {formatDateLabel(group.date)}
              </h2>
              <div className="grid grid-cols-4 gap-3">
                {group.videos.map((video) => (
                  <WatchedVideoCard key={video.id} video={video} />
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
}
