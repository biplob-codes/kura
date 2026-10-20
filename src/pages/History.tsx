import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { VideoCard } from "./Home";
import { DEFAULT_THUMBNAIL, thumbnailSrc } from "../components/mediaUrl";
interface DeletedGroup {
  month: string;
  videos: VideoCard[];
}

function formatMonthLabel(monthStr: string): string {
  const date = new Date(`${monthStr}-01T00:00:00`);
  return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function HistoryCard({ video }: { video: VideoCard }) {
  const [failed, setFailed] = useState(false);
  const src = failed ? DEFAULT_THUMBNAIL : thumbnailSrc(video.thumbnail_path);

  useEffect(() => {
    setFailed(false);
  }, [video.thumbnail_path]);

  return (
    <div className="group block" title={video.title}>
      <div className="relative aspect-video w-full overflow-hidden rounded-md bg-neutral-800">
        <img
          src={src}
          alt={video.title}
          onError={() => {
            if (!failed) setFailed(true);
          }}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </div>

      <div className="mt-2 px-0.5">
        <p className="truncate text-center text-[13px] font-medium text-white/90">
          {video.title}
        </p>
      </div>
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="block">
      <div className="aspect-video w-full animate-pulse rounded-md bg-neutral-800" />
      <div className="mt-2 px-0.5">
        <div className="mx-auto h-3.5 w-4/5 rounded bg-neutral-800" />
      </div>
    </div>
  );
}

function GroupSkeleton() {
  return (
    <section>
      <div className="mb-3 h-4 w-28 animate-pulse rounded bg-white/10" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </section>
  );
}

export default function History() {
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
      <div className="h-full overflow-y-auto p-6">
        <div className="rounded-xl bg-black/40 p-6 text-sm text-white/60">
          <p className="font-medium text-white/90">Couldn't load history</p>
          <p className="mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto px-5 pt-4 pb-8">
      <div className="mb-5 flex items-baseline justify-between gap-3">
        <h1 className="text-lg font-semibold text-white/90">History</h1>
      </div>

      <div className="space-y-7">
        {loading ? (
          <>
            <GroupSkeleton />
            <GroupSkeleton />
          </>
        ) : groups.length === 0 ? (
          <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-white/10 text-sm text-white/40">
            Nothing in history yet
          </div>
        ) : (
          groups.map((group) => (
            <section key={group.month}>
              <h2 className="mb-3 text-[13px] font-semibold tracking-[-0.01em] text-white/50">
                {formatMonthLabel(group.month)}
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {group.videos.map((video) => (
                  <HistoryCard key={video.id} video={video} />
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
}
