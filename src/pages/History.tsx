import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Folder, MoreVertical, Tag as TagIcon, User } from "lucide-react";
import { formatDuration, formatFileSize } from "../utils/files";
import { DEFAULT_THUMBNAIL, thumbnailSrc } from "../components/mediaUrl";

interface Tag {
  id: string;
  name: string;
}

interface Model {
  id: string;
  name: string;
}

interface HistoryVideo {
  id: string;
  title: string;
  thumbnail_path: string | null;
  duration_seconds: number | null;
  size_bytes: number;
  created_at: string;
  last_played_at: string;
  folder_id: string;
  folder_name: string;
  models: Model[];
  tags: Tag[];
}

interface HistoryGroup {
  date: string;
  videos: HistoryVideo[];
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
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function Thumbnail({ path, title }: { path: string | null; title: string }) {
  const [failed, setFailed] = useState(false);
  const src = failed ? DEFAULT_THUMBNAIL : thumbnailSrc(path);

  useEffect(() => {
    setFailed(false);
  }, [path]);

  return (
    <img
      src={src}
      alt={title}
      loading="lazy"
      decoding="async"
      className="h-full w-full object-cover"
      onError={() => {
        if (!failed) setFailed(true);
      }}
    />
  );
}

function HistoryCard({ video }: { video: HistoryVideo }) {
  const [playing, setPlaying] = useState(false);
  const [playError, setPlayError] = useState<string | null>(null);

  async function handlePlay() {
    if (playing) return;
    setPlayError(null);
    setPlaying(true);
    try {
      await invoke("play_video", { videoId: video.id });
    } catch (err) {
      setPlayError(String(err));
    } finally {
      setPlaying(false);
    }
  }

  const models = video.models ?? [];
  const tags = video.tags ?? [];

  return (
    <div className="group flex gap-3 rounded-lg p-1.5 transition-colors hover:bg-white/[0.04]">
      {/* Thumbnail — left */}
      <button
        type="button"
        onClick={handlePlay}
        disabled={playing}
        className="relative w-[168px] shrink-0 cursor-pointer overflow-hidden rounded-lg bg-neutral-800 aspect-video disabled:opacity-70 sm:w-[184px]"
        title={video.title}
      >
        <Thumbnail path={video.thumbnail_path} title={video.title} />
        <span className="absolute bottom-1.5 right-1.5 rounded bg-black/75 px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-white">
          {formatDuration(video.duration_seconds)}
        </span>
      </button>

      {/* Metadata — right */}
      <div className="flex min-w-0 flex-1 flex-col pt-0.5">
        <div className="flex items-start gap-1">
          <button
            type="button"
            onClick={handlePlay}
            disabled={playing}
            className="min-w-0 flex-1 cursor-pointer text-left disabled:opacity-70"
          >
            <h3
              className="line-clamp-2 text-[14px] font-medium leading-snug text-white/90"
              title={video.title}
            >
              {video.title}
            </h3>
          </button>

          {/* Three-dot menu — no actions yet */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/40 opacity-0 transition-opacity hover:bg-white/10 hover:text-white/80 group-hover:opacity-100 cursor-pointer"
            aria-label="More options"
          >
            <MoreVertical size={18} strokeWidth={2} />
          </button>
        </div>

        <p className="mt-1 text-[12px] text-white/45">
          {formatFileSize(video.size_bytes)}
        </p>

        <div className="mt-1.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-white/50">
          <span
            className="inline-flex max-w-full items-center gap-1 truncate"
            title={`Folder: ${video.folder_name}`}
          >
            <Folder
              size={12}
              strokeWidth={2}
              className="shrink-0 text-white/35"
            />
            <span className="truncate">{video.folder_name}</span>
          </span>
        </div>

        {(models.length > 0 || tags.length > 0) && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {models.map((model) => (
              <span
                key={`model-${model.id}`}
                title={`Model: ${model.name}`}
                className="inline-flex max-w-full items-center gap-1 truncate rounded-md bg-white/5 px-1.5 py-0.5 text-[11px] text-white/65"
              >
                <User
                  size={11}
                  strokeWidth={2}
                  className="shrink-0 text-white/35"
                />
                <span className="truncate">{model.name}</span>
              </span>
            ))}
            {tags.map((tag) => (
              <span
                key={`tag-${tag.id}`}
                title={`Tag: ${tag.name}`}
                className="inline-flex max-w-full items-center gap-1 truncate rounded-md bg-white/5 px-1.5 py-0.5 text-[11px] text-white/65"
              >
                <TagIcon
                  size={11}
                  strokeWidth={2}
                  className="shrink-0 text-white/35"
                />
                <span className="truncate">{tag.name}</span>
              </span>
            ))}
          </div>
        )}

        {playError && (
          <p className="mt-1 text-[11px] text-red-400/90">{playError}</p>
        )}
      </div>
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="flex gap-3 p-1.5">
      <div className="aspect-video w-[168px] shrink-0 animate-pulse rounded-lg bg-neutral-800 sm:w-[184px]" />
      <div className="flex min-w-0 flex-1 flex-col gap-2 pt-1">
        <div className="h-4 w-4/5 animate-pulse rounded bg-neutral-800" />
        <div className="h-3 w-1/3 animate-pulse rounded bg-neutral-800" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-neutral-800" />
        <div className="mt-1 flex gap-1.5">
          <div className="h-5 w-14 animate-pulse rounded bg-neutral-800" />
          <div className="h-5 w-16 animate-pulse rounded bg-neutral-800" />
        </div>
      </div>
    </div>
  );
}

function GroupSkeleton() {
  return (
    <section>
      <div className="mb-3 h-4 w-28 animate-pulse rounded bg-white/10" />
      <div className="grid grid-cols-1 gap-x-4 gap-y-2 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </section>
  );
}

export default function History() {
  const [groups, setGroups] = useState<HistoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    invoke<HistoryGroup[]>("get_history_videos")
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

      <div className="space-y-8">
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
            <section key={group.date}>
              <h2 className="mb-3 text-[13px] font-semibold tracking-[-0.01em] text-white/50">
                {formatDateLabel(group.date)}
              </h2>
              <div className="grid grid-cols-1 gap-x-4 gap-y-1 md:grid-cols-2">
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
