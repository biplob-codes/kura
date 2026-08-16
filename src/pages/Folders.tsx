import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { FolderCardItem, FolderCardSkeleton } from "../components/FolderCard";

export interface FolderCard {
  id: string;
  name: string;
  thumbnail_path: string | null;
  video_count: number;
}

export default function Folders({
  onFolderClick,
}: {
  onFolderClick?: (folder: FolderCard) => void;
}) {
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
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
        <p className="font-medium text-slate-700">Couldn't load your folders</p>
        <p className="mt-1">{error}</p>
      </div>
    );
  }

  if (!loading && folders.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-slate-200 text-sm text-slate-400">
        No folders yet
      </div>
    );
  }

  return (
    <div className="pt-2 px-5 pb-7">
      <div className="grid grid-cols-3 gap-4">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
              <FolderCardSkeleton key={i} />
            ))
          : folders.map((folder) => (
              <FolderCardItem
                key={folder.id}
                folder={folder}
                onClick={onFolderClick}
              />
            ))}
      </div>
    </div>
  );
}
