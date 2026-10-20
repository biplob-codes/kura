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

  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [selectedModelIds, setSelectedModelIds] = useState<string[]>([]);

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
    setSelectedTagIds([]);
    setSelectedModelIds([]);
  };

  const handleSkip = () => {
    if (!currentFile) return;
    goToNext();
  };

  const handleToggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId],
    );
  };

  const handleToggleModel = (modelId: string) => {
    setSelectedModelIds((prev) =>
      prev.includes(modelId)
        ? prev.filter((id) => id !== modelId)
        : [...prev, modelId],
    );
  };

  const handleMoveToFolder = async (folder: Folder) => {
    if (!currentFile || isMoving) return;

    setIsMoving(true);
    setMovingFolderPath(folder.path);
    try {
      const newPath = `${folder.path}/${currentFile.name}`;
      await invoke("queue_transfer_video", {
        old: currentFile.path,
        new: newPath,
        folderId: folder.id,
        title: currentFile.name.replace(/\.[^/.]+$/, ""),
        tagIds: selectedTagIds,
        modelIds: selectedModelIds,
      });

      // Remove the transferred file so the list (and last-item case) updates.
      // Index stays the same — the next file slides into place; if this was
      // the last one, currentFile becomes undefined and the empty state shows.
      setFiles((prev) => prev.filter((_, i) => i !== currentIndex));
      setSelectedTagIds([]);
      setSelectedModelIds([]);
    } catch (err) {
      console.error("Failed to queue transfer:", err);
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
    <div className="flex h-full w-full gap-4 px-8 py-4 text-[15px] text-white/90">
      {/* Main column — same shared bg as sidebar (no separate fill) */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex flex-col gap-4 pb-4">
          <div className="aspect-video w-full max-w-3xl shrink-0 overflow-hidden rounded-lg bg-black">
            {currentFile ? (
              <VideoPlayer path={currentFile.path} />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[15px] text-white/40">
                {loadingFiles
                  ? "Loading videos…"
                  : "No videos left in the inbox"}
              </div>
            )}
          </div>

          <div className="w-full max-w-3xl">
            <TransferMetadata
              currentIndex={currentIndex}
              file={currentFile}
              hasNext={hasNext}
              isMoving={isMoving}
              loading={loadingFiles}
              numberOfFiles={files.length}
              onSkip={handleSkip}
              selectedTagIds={selectedTagIds}
              onToggleTag={handleToggleTag}
              selectedModelIds={selectedModelIds}
              onToggleModel={handleToggleModel}
            />
          </div>
        </div>
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
  );
};

export default VideoMove;
