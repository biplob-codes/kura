import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import VideoPlayer from "../components/VideoPlayer";

interface Folder {
  name: string;
  path: string;
}

interface File {
  name: string;
  path: string;
  size: number;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

const Transfer = () => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loadingFolders, setLoadingFolders] = useState(true);

  const [files, setFiles] = useState<File[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [isMoving, setIsMoving] = useState(false);
  const [movingFolderPath, setMovingFolderPath] = useState<string | null>(null);

  const [newFolderName, setNewFolderName] = useState("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  useEffect(() => {
    invoke<Folder[]>("list_folders", { dir: "library" })
      .then((res) => setFolders(res))
      .finally(() => setLoadingFolders(false));
  }, []);

  useEffect(() => {
    invoke<File[]>("list_inbox_files")
      .then((res) => setFiles(res))
      .finally(() => setLoadingFiles(false));
  }, []);

  const currentFile = files[currentIndex];
  const hasNext = currentIndex < files.length - 1;

  const goToNext = () => {
    setCurrentIndex((i) => (i < files.length - 1 ? i + 1 : i));
  };

  const handleSkip = () => {
    if (!currentFile) return;
    goToNext();
  };

  const handleMoveToFolder = async (folder: Folder) => {
    if (!currentFile || isMoving) return;

    setIsMoving(true);
    setMovingFolderPath(folder.path);
    try {
      const newPath = `${folder.path}/${currentFile.name}`;

      await invoke("move_video", {
        old: currentFile.path,
        new: newPath,
      });
      goToNext();
    } catch (err) {
      console.error("Failed to move video:", err);
    } finally {
      setIsMoving(false);
      setMovingFolderPath(null);
    }
  };

  const handleCreateFolder = async () => {
    const name = newFolderName.trim();
    if (!name || isCreatingFolder) return;

    setIsCreatingFolder(true);
    try {
      const created = await invoke<Folder>("create_folder", { name });
      setFolders((prev) => [...prev, created]);
      setNewFolderName("");
    } catch (err) {
      console.error("Failed to create folder:", err);
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const handleCreateFolderKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCreateFolder();
    }
  };

  return (
    <div className="flex h-screen w-full items-stretch justify-center bg-neutral-50 text-neutral-900 p-3">
      <div className="flex h-full w-full max-w-6xl gap-4">
        {/* Middle: player + metadata */}
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
            {currentFile ? (
              <VideoPlayer path={currentFile.path} />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-neutral-400">
                {loadingFiles
                  ? "Loading videos…"
                  : "No videos left in the inbox"}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
            {currentFile ? (
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-neutral-800">
                    {currentFile.name}
                  </p>
                  <p className="mt-1 text-xs text-neutral-400">
                    {formatSize(currentFile.size)} · {currentIndex + 1} of{" "}
                    {files.length}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleSkip}
                  disabled={!hasNext || isMoving}
                  className="shrink-0 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Skip
                </button>
              </div>
            ) : (
              <p className="text-sm text-neutral-400">
                {loadingFiles ? "Loading metadata…" : "Nothing to show"}
              </p>
            )}
          </div>
        </div>

        {/* Right: folder list */}
        <div className="flex w-64 shrink-0 flex-col rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-neutral-700">
            Folders
          </h2>

          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
            {loadingFolders ? (
              <p className="text-xs text-neutral-400">Loading folders…</p>
            ) : folders.length === 0 ? (
              <p className="text-xs text-neutral-400">No folders yet</p>
            ) : (
              folders.map((folder) => (
                <button
                  key={folder.path}
                  type="button"
                  onClick={() => handleMoveToFolder(folder)}
                  disabled={!currentFile || isMoving}
                  className="truncate rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-left text-sm text-neutral-700 transition-colors hover:bg-neutral-100 hover:border-neutral-300 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {movingFolderPath === folder.path ? "Moving…" : folder.name}
                </button>
              ))
            )}
          </div>

          <div className="mt-3 flex flex-col gap-2 border-t border-neutral-100 pt-3">
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={handleCreateFolderKeyDown}
              placeholder="New folder name"
              disabled={isCreatingFolder}
              className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-300 disabled:opacity-60"
            />
            <button
              type="button"
              onClick={handleCreateFolder}
              disabled={!newFolderName.trim() || isCreatingFolder}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isCreatingFolder ? "Creating…" : "Create folder"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Transfer;
