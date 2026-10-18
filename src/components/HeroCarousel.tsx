import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { VideoCard } from "../pages/Home";
import { formatDuration } from "../utils/files";
import { mediaUrl } from "./mediaUrl";
import { useAmbient } from "../AmbientContext";

interface HeroCarouselProps {
  videos: VideoCard[];
  loading?: boolean;
}

export function HeroCarousel({ videos, loading }: HeroCarouselProps) {
  const [index, setIndex] = useState(0);
  const { setAmbientSrc } = useAmbient();

  const slides = useMemo(() => {
    const withThumbs = videos.filter((v) => v.thumbnail_path);
    return withThumbs.length > 0 ? withThumbs : videos;
  }, [videos]);

  const current = slides[index] ?? null;
  const count = slides.length;

  const go = useCallback(
    (dir: 1 | -1) => {
      if (count === 0) return;
      setIndex((i) => (i + dir + count) % count);
    },
    [count],
  );

  useEffect(() => {
    if (count < 2) return;
    const id = setInterval(() => go(1), 6500);
    return () => clearInterval(id);
  }, [go, count, index]);

  useEffect(() => {
    const src = current?.thumbnail_path
      ? mediaUrl(current.thumbnail_path)
      : null;
    setAmbientSrc(src);
    return () => setAmbientSrc(null);
  }, [current?.id, current?.thumbnail_path, setAmbientSrc]);

  if (loading) {
    return <div className="h-full w-full animate-pulse bg-black/20" />;
  }

  if (!current) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <p className="text-sm text-white/50">No recent videos yet</p>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Text sits over the full-screen ambient image */}
      <div className="relative z-10 flex h-full flex-col justify-end p-8 md:p-12">
        <div className="max-w-xl space-y-3">
          <p className="text-xs font-medium uppercase tracking-widest text-white/70">
            Recent
          </p>
          <h1 className="text-2xl font-bold leading-tight text-white sm:text-3xl md:text-4xl drop-shadow-lg">
            {current.title}
          </h1>
          {current.duration_seconds != null && (
            <p className="text-sm text-white/75">
              {formatDuration(current.duration_seconds)}
            </p>
          )}

          <div className="pt-2">
            <Link
              to={`/videos/${current.id}`}
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-white/90"
            >
              <Play size={16} fill="currentColor" />
              Watch now
            </Link>
          </div>
        </div>
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            className="absolute left-4 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60"
            aria-label="Previous"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            className="absolute right-4 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60"
            aria-label="Next"
          >
            <ChevronRight size={22} />
          </button>
        </>
      )}

      {count > 1 && (
        <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              className={[
                "h-1.5 rounded-full transition-all",
                i === index
                  ? "w-6 bg-white"
                  : "w-1.5 bg-white/40 hover:bg-white/70",
              ].join(" ")}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
