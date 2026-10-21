import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { VideoCard } from "../pages/Home";
import { formatDuration } from "../utils/files";
import { DEFAULT_THUMBNAIL, thumbnailSrc } from "./mediaUrl";

export function WatchedVideoCard({ video }: { video: VideoCard }) {
  return (
    <Link
      to={`/videos/${video.id}`}
      className="group block overflow-hidden rounded-md bg-neutral-800"
      title={video.title}
    >
      <div className="relative aspect-video w-full">
        <Thumbnail path={video.thumbnail_path} title={video.title} />
        <span className="absolute bottom-1.5 right-1.5 rounded bg-black/75 px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-white">
          {formatDuration(video.duration_seconds)}
        </span>
      </div>
    </Link>
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
      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
      onError={() => {
        if (!failed) setFailed(true);
      }}
    />
  );
}
