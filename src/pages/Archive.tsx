import { useEffect, useState } from "react";
import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { VideoCard } from "./Home";

interface DeletedGroup {
  month: string; // "YYYY-MM"
  videos: VideoCard[];
}

function formatMonthLabel(monthStr: string): string {
  // monthStr is "YYYY-MM" — append a day so Date parses it reliably
  // across browsers/locales.
  const date = new Date(`${monthStr}-01T00:00:00`);
  return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

// Thumbnail-only card, no navigation — hovering reveals the title via a
// gradient overlay, and that's the entire interaction. No duration, no
// size, no buttons: archived videos aren't meant to invite action here.
function ArchivedCard({ video }: { video: VideoCard }) {
  const [failed, setFailed] = useState(false);
  const hasImage = video.thumbnail_path && !failed;

  return (
    <div
      className="group relative aspect-video w-full overflow-hidden rounded-sm border border-slate-200 dark:border-neutral-700 bg-slate-100 dark:bg-neutral-800"
      title={video.title}
    >
      {hasImage ? (
        <img
          src={convertFileSrc(video.thumbnail_path as string)}
          alt={video.title}
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-7 w-7 text-slate-300 dark:text-neutral-500"
          >
            <rect
              x="2.5"
              y="5.5"
              width="19"
              height="13"
              rx="2"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path d="M10 9.5l5 3-5 3v-6z" fill="currentColor" />
          </svg>
        </div>
      )}
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="aspect-video w-full animate-pulse rounded-sm bg-slate-100 dark:bg-neutral-700" />
  );
}

function GroupSkeleton() {
  return (
    <section>
      <div className="mb-3 h-5 w-32 animate-pulse rounded bg-slate-100 dark:bg-neutral-700" />
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
        {Array.from({ length: 8 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </section>
  );
}

export default function Archive() {
  const [groups, setGroups] = useState<DeletedGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    invoke<DeletedGroup[]>("get_deleted_videos")
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
        <div className="rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-6 text-sm text-slate-500 dark:text-neutral-400">
          <p className="font-medium text-slate-700 dark:text-neutral-200">
            Couldn't load archived videos
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
        <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-slate-200 dark:border-neutral-700 text-sm text-slate-400 dark:text-neutral-500">
          Nothing archived yet
        </div>
      ) : (
        groups.map((group) => (
          <section key={group.month}>
            <h2 className="mb-3 text-base font-semibold text-slate-800 dark:text-neutral-100">
              {formatMonthLabel(group.month)}
            </h2>
            <div className="grid grid-cols-4 gap-4">
              {group.videos.map((video) => (
                <ArchivedCard key={video.id} video={video} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
