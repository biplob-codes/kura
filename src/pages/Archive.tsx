import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { VideoCard } from "./Home";
import { mediaUrl } from "../components/mediaUrl";

interface DeletedGroup {
  month: string;
  videos: VideoCard[];
}

function formatMonthLabel(monthStr: string): string {
  const date = new Date(`${monthStr}-01T00:00:00`);
  return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function ArchivedCard({ video }: { video: VideoCard }) {
  const [failed, setFailed] = useState(false);
  const src = mediaUrl(video.thumbnail_path);
  const hasImage = src && !failed;

  return (
    <div
      className="group relative aspect-video w-full overflow-hidden rounded-[8px] border border-black/[0.06] dark:border-white/[0.08] bg-[#f0f0f2] dark:bg-[#2c2c2e]"
      title={video.title}
    >
      {hasImage ? (
        <img
          src={src!}
          alt={video.title}
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-6 w-6 text-[#c7c7cc] dark:text-[#636366]"
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
      <div className="pointer-events-none absolute inset-0 flex items-end bg-gradient-to-t from-black/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100">
        <p className="truncate px-2 pb-1.5 text-[11px] font-medium text-white">
          {video.title}
        </p>
      </div>
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="aspect-video w-full animate-pulse rounded-[8px] bg-[#f0f0f2] dark:bg-[#3a3a3c]" />
  );
}

function GroupSkeleton() {
  return (
    <section>
      <div className="mb-3 h-4 w-28 animate-pulse rounded bg-[#e8e8ed] dark:bg-[#3a3a3c]" />
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
      <div className="p-6">
        <div className="rounded-[12px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#2c2c2e] p-5 text-[13px] text-[#86868b]">
          <p className="font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">
            Couldn't load archived videos
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
          Archive
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
            Nothing archived yet
          </div>
        ) : (
          groups.map((group) => (
            <section key={group.month}>
              <h2 className="mb-3 text-[13px] font-semibold tracking-[-0.01em] text-[#86868b] dark:text-[#98989d]">
                {formatMonthLabel(group.month)}
              </h2>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
                {group.videos.map((video) => (
                  <ArchivedCard key={video.id} video={video} />
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
}
