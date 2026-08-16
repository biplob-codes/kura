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
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
        <p className=" text-slate-400">{description}</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : videos.length === 0 ? (
        <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-slate-200 text-sm text-slate-400">
          Nothing here yet
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {videos.map((video) => (
            <VideoCardItem key={video.id} video={video} />
          ))}
        </div>
      )}
    </section>
  );
}
