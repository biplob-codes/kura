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
      <div className="p-5">
        <div className="rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-6 text-sm text-slate-500 dark:text-neutral-400">
          <p className="font-medium text-slate-700 dark:text-neutral-200">Couldn't load your folders</p>
          <p className="mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (!loading && folders.length === 0) {
    return (
      <div className="p-5">
        <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-slate-200 dark:border-neutral-700 text-sm text-slate-400 dark:text-neutral-500">
          No folders yet
        </div>
      </div>
    );
  }

  return (
    <div className="p-5">
      <div className="grid grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
              <FolderCardSkeleton key={i} />
            ))
          : folders.map((folder) => (
              <FolderCardItem key={folder.id} folder={folder} />
            ))}
      </div>
    </div>
  );
}
