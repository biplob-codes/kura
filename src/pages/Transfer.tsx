import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import VideoPlayer from "../components/VideoPlayer";
import FolderList, { Folder } from "../components/FolderList";
import TransferMetadata from "../components/TransferMetadata";

export interface File {
  name: string;
  path: string;
  size: number;
}

const VideoMove = () => {
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
    invoke<Folder[]>("get_library_folders")
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
      await invoke("transfer_video", {
        old: currentFile.path,
        new: newPath,
        folderId: folder.id,
        title: currentFile.name.replace(/\.[^/.]+$/, ""), // strip extension
        tagIds: [], // wire up real tag selection later
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

  return (
    <div className="flex h-screen w-full items-stretch justify-center bg-neutral-50 text-neutral-900 p-3">
      <div className="flex h-full w-full max-w-6xl gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="min-h-0  overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
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
          <TransferMetadata
            currentIndex={currentIndex}
            file={currentFile}
            hasNext={hasNext}
            isMoving={isMoving}
            loading={loadingFiles}
            numberOfFiles={files.length}
            onSkip={handleSkip}
          />
        </div>

        <FolderList
          folders={folders}
          loading={loadingFolders}
          disabled={!currentFile || isMoving}
          movingFolderPath={movingFolderPath}
          onSelectFolder={handleMoveToFolder}
          newFolderName={newFolderName}
          onNewFolderNameChange={setNewFolderName}
          isCreatingFolder={isCreatingFolder}
          onCreateFolder={handleCreateFolder}
        />
      </div>
    </div>
  );
};

export default VideoMove;
