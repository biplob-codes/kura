import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import VideoPlayer from "../components/VideoPlayer";
import FolderList, { Folder } from "../components/FolderList";
import TransferMetadata from "../components/TransferMetadata";
import type { LayoutContext } from "../Layout";

export interface File {
  name: string;
  path: string;
  size: number;
}

const VideoMove = () => {
  const { collapsed } = useOutletContext<LayoutContext>();

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
      goToNext();
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
    <div
      className={[
        "flex h-full w-full flex-col",
        collapsed ? "px-2 py-2" : "px-3 py-2",
      ].join(" ")}
    >
      <div className="mb-2 px-1">
        <h1 className="text-[17px] font-semibold tracking-[-0.02em] text-[#1d1d1f] dark:text-[#f5f5f7]">
          Transfer
        </h1>
        <p className="text-[12px] text-[#86868b] dark:text-[#98989d]">
          Sort inbox videos into folders
        </p>
      </div>

      <div className="flex min-h-0 flex-1 gap-3">
        <div className="flex min-w-0 flex-1 flex-col min-h-0 overflow-y-auto">
          <div className="flex flex-col gap-2.5 pb-2">
            <div className="w-full shrink-0 overflow-hidden rounded-[12px] border border-black/[0.06] dark:border-white/[0.08] bg-black shadow-sm aspect-video">
              {currentFile ? (
                <VideoPlayer path={currentFile.path} />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[#86868b] text-[13px]">
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
              selectedTagIds={selectedTagIds}
              onToggleTag={handleToggleTag}
              selectedModelIds={selectedModelIds}
              onToggleModel={handleToggleModel}
            />
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
    </div>
  );
};

export default VideoMove;
