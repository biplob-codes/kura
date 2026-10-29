import { useEffect, useState } from "react";
import { VideoCard } from "../pages/Home";
import { formatDuration, formatFileSize } from "../utils/files";
import { DEFAULT_THUMBNAIL, thumbnailSrc } from "./mediaUrl";

export function WatchedVideoCard({ video }: { video: VideoCard }) {
  return (
    <div className="overflow-hidden" title={video.title}>
      <div className="relative aspect-video w-full overflow-hidden rounded-md bg-neutral-800">
        <Thumbnail path={video.thumbnail_path} title={video.title} />
        <span className="absolute bottom-1.5 right-1.5 rounded bg-black/75 px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-white">
          {formatDuration(video.duration_seconds)}
        </span>
      </div>
      <div className="mt-2 min-w-0">
        <p
          className="line-clamp-2 text-[13px] font-medium leading-snug text-white/90 text-center"
          title={video.title}
        >
          {video.title}
        </p>
        <p className="mt-0.5 text-[12px] text-white/45 text-center">
          {formatFileSize(video.size_bytes)}
        </p>
      </div>
    </div>
  );
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
