import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { FolderCardItem, FolderCardSkeleton } from "../components/FolderCard";

export interface FolderCard {
  id: string;
  name: string;
  thumbnail_path: string | null;
  video_count: number;
}

export default function Folders() {
  const [folders, setFolders] = useState<FolderCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    invoke<FolderCard[]>("get_folders")
      .then((result) => {
        if (!cancelled) setFolders(result);
      })
      .catch((err) => {
        if (!cancelled) setError(String(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-[12px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#2c2c2e] p-5 text-[13px] text-[#86868b]">
          <p className="font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">
            Couldn't load your folders
          </p>
          <p className="mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 pb-8">
      <div className="sticky top-0 z-10 -mx-5 px-5 py-3 bg-[#f5f5f7]/85 dark:bg-[#1c1c1e]/85 backdrop-blur-xl border-b border-black/[0.04] dark:border-white/[0.06]">
        <div className="flex items-baseline justify-between">
          <h1 className="text-[22px] font-bold tracking-[-0.03em] text-[#1d1d1f] dark:text-[#f5f5f7]">
            Folders
          </h1>
          {!loading && (
            <span className="text-[12px] text-[#86868b] dark:text-[#98989d]">
              {folders.length} {folders.length === 1 ? "folder" : "folders"}
            </span>
          )}
        </div>
      </div>

      {!loading && folders.length === 0 ? (
        <div className="mt-6 flex h-32 items-center justify-center rounded-[12px] border border-dashed border-black/[0.1] dark:border-white/[0.12] text-[13px] text-[#86868b]">
          No folders yet
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <FolderCardSkeleton key={i} />
              ))
            : folders.map((folder) => (
                <FolderCardItem key={folder.id} folder={folder} />
              ))}
        </div>
      )}
    </div>
  );
}
