import { useState } from "react";
import { Link } from "react-router-dom";
import { FolderCard } from "../pages/Folders";
import { mediaUrl } from "./mediaUrl";

export function FolderCardItem({ folder }: { folder: FolderCard }) {
  const [imgFailed, setImgFailed] = useState(false);
  const src = mediaUrl(folder.thumbnail_path);
  const hasImage = src && !imgFailed;

  return (
    <Link to={`/folders/${folder.id}`} className="block group">
      <button
        type="button"
        title={folder.name}
        className="relative aspect-[4/3] w-full overflow-hidden rounded-[10px] cursor-pointer border border-black/[0.06] dark:border-white/[0.08] bg-[#f0f0f2] dark:bg-[#2c2c2e] text-left shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_6px_16px_rgba(0,0,0,0.35)]"
      >
        {hasImage ? (
          <img
            src={src!}
            alt=""
            onError={() => setImgFailed(true)}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#e8e8ed] to-[#d2d2d7] dark:from-[#3a3a3c] dark:to-[#2c2c2e]">
            <FolderIcon />
          </div>
        )}

        {hasImage && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
        )}

        <div className="absolute inset-x-0 bottom-0 p-3">
          <p
            className={`truncate text-[13px] font-semibold tracking-[-0.01em] ${
              hasImage ? "text-white" : "text-[#1d1d1f] dark:text-[#f5f5f7]"
            }`}
          >
            {folder.name}
          </p>
          <p
            className={`text-[11px] ${
              hasImage ? "text-white/75" : "text-[#86868b] dark:text-[#98989d]"
            }`}
          >
            {folder.video_count}{" "}
            {folder.video_count === 1 ? "video" : "videos"}
          </p>
        </div>
      </button>
    </Link>
  );
}

function FolderIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-10 w-10 text-[#007AFF]/70 dark:text-[#0A84FF]/70"
    >
      <path
        d="M3 6.5c0-.83.67-1.5 1.5-1.5h4.4c.34 0 .67.12.93.33l1.6 1.34c.26.21.59.33.93.33H19.5c.83 0 1.5.67 1.5 1.5v9.5c0 .83-.67 1.5-1.5 1.5h-15C3.67 19.5 3 18.83 3 18v-11.5z"
        fill="currentColor"
        opacity="0.9"
      />
    </svg>
  );
}

export function FolderCardSkeleton() {
  return (
    <div className="aspect-[4/3] w-full animate-pulse rounded-[10px] border border-black/[0.06] dark:border-white/[0.08] bg-[#f0f0f2] dark:bg-[#2c2c2e]" />
  );
}
