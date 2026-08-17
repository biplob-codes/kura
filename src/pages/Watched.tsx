import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { WatchedVideoCard } from "../components/WatchedVideoCard";
import { VideoCard } from "./Home";

interface WatchedGroup {
  date: string; // "YYYY-MM-DD"
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
    <div className="w-full animate-pulse rounded-sm border border-slate-200 bg-white">
      <div className="aspect-video w-full bg-slate-100" />
      <div className="h-8 border-t border-slate-200 bg-slate-50" />
    </div>
  );
}

function GroupSkeleton() {
  return (
    <section>
      <div className="mb-3 h-5 w-32 animate-pulse rounded bg-slate-100" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
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

  // Removes a video from whichever group it's in (after a successful
  // restore or trash), and drops the group entirely if that was its last
  // video — so an emptied-out date heading doesn't linger with nothing
  // under it.
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
      <div className="p-8">
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
          <p className="font-medium text-slate-700">
            Couldn't load watched videos
          </p>
          <p className="mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-8">
      {loading ? (
        <>
          <GroupSkeleton />
          <GroupSkeleton />
        </>
      ) : groups.length === 0 ? (
        <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-slate-200 text-sm text-slate-400">
          No watched videos yet
        </div>
      ) : (
        groups.map((group) => (
          <section key={group.date}>
            <h2 className="mb-3 text-base font-semibold text-slate-800">
              {formatDateLabel(group.date)}
            </h2>
            <div className="grid grid-cols-3 gap-4 ">
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
  );
}
