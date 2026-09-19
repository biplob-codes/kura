import { useState } from "react";
import { FolderCard } from "../pages/Folders";
import { convertFileSrc } from "@tauri-apps/api/core";
import { Link } from "react-router-dom";

export function FolderCardItem({ folder }: { folder: FolderCard }) {
  const [imgFailed, setImgFailed] = useState(false);
  const hasImage = folder.thumbnail_path && !imgFailed;

  return (
    <Link to={`/folders/${folder.id}`}>
      <button
        title={folder.name}
        className="group relative aspect-4/3 w-full overflow-hidden rounded-md cursor-pointer border border-slate-200 dark:border-neutral-700 bg-slate-100 dark:bg-neutral-800 text-left shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md"
      >
        {hasImage ? (
          <img
            src={convertFileSrc(folder.thumbnail_path as string)}
            alt=""
            onError={() => setImgFailed(true)}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-slate-100 to-slate-200 dark:from-neutral-800 dark:to-neutral-700">
            <FolderIcon />
          </div>
        )}

        {/* Darken the bottom of the image so white title text stays readable
          regardless of what's in the underlying frame. Only applied over
          real thumbnails — the icon fallback is already light and doesn't
          need it. */}
        {hasImage && (
          <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent" />
        )}

        <div className="absolute inset-x-0 bottom-0 p-3">
          <p
            className={`truncate text-sm font-semibold ${
              hasImage ? "text-white" : "text-slate-700 dark:text-neutral-200"
            }`}
          >
            {folder.name}
          </p>
          <p
            className={`text-xs ${hasImage ? "text-white/75" : "text-slate-400 dark:text-neutral-400"}`}
          >
            {folder.video_count} {folder.video_count === 1 ? "video" : "videos"}
          </p>
        </div>
      </button>
    </Link>
  );
}
function FolderIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8 text-slate-300 dark:text-neutral-500">
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
    <div className="aspect-4/3 w-full animate-pulse rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-100 dark:bg-neutral-800" />
  );
}
