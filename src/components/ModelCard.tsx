import { useState } from "react";
import { Link } from "react-router-dom";
import { mediaUrl } from "./mediaUrl";

export interface ModelCard {
  id: string;
  name: string;
  thumbnail_path: string | null;
  video_count: number;
}

export function ModelCardItem({ model }: { model: ModelCard }) {
  const [imgFailed, setImgFailed] = useState(false);
  const src = mediaUrl(model.thumbnail_path);
  const hasImage = src && !imgFailed;

  return (
    <Link to={`/models/${model.id}`} className="group block">
      {/* Image only */}
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
            <UsersIcon />
          </div>
        )}
      </div>

      {/* Text under the card */}
      <div className="mt-2.5 px-0.5 text-center">
        <p className="truncate text-[13px] font-medium text-white/90">
          {model.name}
        </p>
        <p className="mt-0.5 text-[12px] font-normal text-white/45">
          {model.video_count} {model.video_count === 1 ? "video" : "videos"}
        </p>
      </div>
    </Link>
  );
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8 text-neutral-500">
      <path
        d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ModelCardSkeleton() {
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
