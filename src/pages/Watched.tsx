import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { VideoCard } from "./Home";
import { VideoCardItem } from "../components/VideoCard";

interface WatchedGroup {
  date: string; // "YYYY-MM-DD"
  videos: VideoCard[];
}

function formatDateLabel(dateStr: string): string {
  // Parsed as local midnight rather than UTC, so "today"/"yesterday"
  // matches what the user's clock actually says.
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
    <div className="w-full animate-pulse rounded-xl border border-slate-200 bg-white p-2.5">
      <div className="aspect-video w-full rounded-lg bg-slate-100" />
      <div className="mt-2 space-y-1.5 px-0.5">
        <div className="h-3.5 w-4/5 rounded bg-slate-100" />
        <div className="h-3 w-1/3 rounded bg-slate-100" />
      </div>
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
    <div className="space-y-8 p-5">
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
            <div className="grid grid-cols-4 gap-4">
              {group.videos.map((video) => (
                <VideoCardItem key={video.id} video={video} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
