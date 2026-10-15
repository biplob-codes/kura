import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { VideoCard } from "../pages/Home";
import { formatDuration } from "../utils/files";
import { mediaUrl } from "./mediaUrl";

interface HeroCarouselProps {
  videos: VideoCard[];
  loading?: boolean;
}

export function HeroCarousel({ videos, loading }: HeroCarouselProps) {
  const [index, setIndex] = useState(0);

  // Prefer videos that have a thumbnail
  const withThumbs = videos.filter((v) => v.thumbnail_path);
  const slides = withThumbs.length > 0 ? withThumbs : videos;
  const current = slides[index] ?? null;
  const count = slides.length;

  const go = useCallback(
    (dir: 1 | -1) => {
      if (count === 0) return;
      setIndex((i) => (i + dir + count) % count);
    },
    [count],
  );

  // Continuous loop
  useEffect(() => {
    if (count < 2) return;
    const id = setInterval(() => go(1), 6500);
    return () => clearInterval(id);
  }, [go, count, index]);

  if (loading) {
    return <div className="h-full w-full animate-pulse bg-neutral-900" />;
  }

  if (!current) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-neutral-950">
        <p className="text-sm text-neutral-500">No recent videos yet</p>
      </div>
    );
  }

  // THIS is the correct way in this codebase
  const src = mediaUrl(current.thumbnail_path);

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Ambient background from current image */}
      {src && (
        <div className="pointer-events-none absolute inset-0 z-0">
          <img
            key={`bg-${current.id}`}
            src={src}
            alt=""
            className="absolute inset-0 h-full w-full scale-125 object-cover blur-[90px] opacity-55"
          />
          <div className="absolute inset-0 bg-black/40" />
        </div>
      )}

      {/* Main full-screen image */}
      <div className="relative z-10 h-full w-full">
        {src ? (
          <img
            key={`slide-${current.id}`}
            src={src}
            alt={current.title}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-neutral-800">
            <span className="text-sm text-neutral-500">No thumbnail</span>
          </div>
        )}

        {/* Gradients for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/10" />

        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-12">
          <div className="max-w-2xl space-y-4">
            <p className="text-xs font-medium uppercase tracking-widest text-white/60">
              Recent
            </p>
            <h1 className="text-3xl font-bold leading-tight text-white md:text-5xl drop-shadow-lg">
              {current.title}
            </h1>
            {current.duration_seconds != null && (
              <p className="text-base text-white/70">
                {formatDuration(current.duration_seconds)}
              </p>
            )}

            <div className="pt-2">
              <Link
                to={`/videos/${current.id}`}
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-white/90"
              >
                <Play size={18} fill="currentColor" />
                Watch now
              </Link>
            </div>
          </div>
        </div>

        {/* Arrows */}
        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              className="absolute left-4 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition hover:bg-black/70"
              aria-label="Previous"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              className="absolute right-4 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition hover:bg-black/70"
              aria-label="Next"
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}

        {/* Dots */}
        {count > 1 && (
          <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                className={[
                  "h-1.5 rounded-full transition-all",
                  i === index
                    ? "w-7 bg-white"
                    : "w-1.5 bg-white/40 hover:bg-white/70",
                ].join(" ")}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
