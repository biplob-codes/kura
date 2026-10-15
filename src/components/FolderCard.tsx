import { useState } from "react";
import { FolderCard } from "../pages/Folders";
import { Link } from "react-router-dom";
import { mediaUrl } from "./mediaUrl";

export function FolderCardItem({ folder }: { folder: FolderCard }) {
  const [imgFailed, setImgFailed] = useState(false);
  const src = mediaUrl(folder.thumbnail_path);
  const hasImage = src && !imgFailed;

  return (
    <Link to={`/folders/${folder.id}`} className="group block">
      {/* Image only – no text overlay, no dark filter */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-neutral-800">
        {hasImage ? (
          <img
            src={src}
            alt=""
            onError={() => setImgFailed(true)}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-neutral-800">
            <FolderIcon />
          </div>
        )}
      </div>

      {/* Text under the card */}
      <div className="mt-2.5 px-0.5 text-center">
        <p className="truncate text-[13px] font-medium text-white/90">
          {folder.name}
        </p>
        <p className="mt-0.5 text-[12px] font-normal text-white/45">
          {folder.video_count} {folder.video_count === 1 ? "video" : "videos"}
        </p>
      </div>
    </Link>
  );
}

function FolderIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8 text-neutral-500">
      <path
        d="M3 6.5c0-.83.67-1.5 1.5-1.5h4.4c.34 0 .67.12.93.33l1.6 1.34c.26.21.59.33.93.33H19.5c.83 0 1.5.67 1.5 1.5v9.5c0 .83-.67 1.5-1.5 1.5h-15C3.67 19.5 3 18.83 3 18v-11.5z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function FolderCardSkeleton() {
  return (
    <div className="block">
      <div className="aspect-[4/3] w-full animate-pulse rounded-lg bg-neutral-800" />
      <div className="mt-2.5 flex flex-col items-center gap-1.5">
        <div className="h-3.5 w-3/5 rounded bg-neutral-800" />
        <div className="h-3 w-1/4 rounded bg-neutral-800" />
      </div>
    </div>
  );
}
