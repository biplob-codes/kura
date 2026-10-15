import { VideoCard } from "../pages/Home";
import { CardSkeleton, VideoCardItem } from "./VideoCard";

export function VideoSection({
  title,
  description,
  videos,
  loading,
}: {
  title: string;
  description: string;
  videos: VideoCard[];
  loading: boolean;
}) {
  return (
    <section>
      <div className="mb-3">
        <h2 className="text-[15px] font-semibold tracking-[-0.02em] text-[#1d1d1f] dark:text-[#f5f5f7]">
          {title}
        </h2>
        <p className="text-[12px] text-[#86868b] dark:text-[#98989d]">
          {description}
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : videos.length === 0 ? (
        <div className="flex h-24 items-center justify-center rounded-[10px] border border-dashed border-black/[0.1] dark:border-white/[0.12] text-[13px] text-[#86868b] dark:text-[#98989d]">
          Nothing here yet
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {videos.map((video) => (
            <VideoCardItem key={video.id} video={video} />
          ))}
        </div>
      )}
    </section>
  );
}
