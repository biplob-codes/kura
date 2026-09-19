import { KeyboardEvent } from "react";

export interface Folder {
  id: string;
  name: string;
  path: string;
}

interface FolderListProps {
  folders: Folder[];
  loading: boolean;
  disabled: boolean;
  movingFolderPath: string | null;
  onSelectFolder: (folder: Folder) => void;
  newFolderName: string;
  onNewFolderNameChange: (value: string) => void;
  isCreatingFolder: boolean;
  onCreateFolder: () => void;
}

const FolderList = ({
  folders,
  loading,
  disabled,
  movingFolderPath,
  onSelectFolder,
  newFolderName,
  onNewFolderNameChange,
  isCreatingFolder,
  onCreateFolder,
}: FolderListProps) => {
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onCreateFolder();
    }
  };
  console.log("ssssss", folders);

  return (
    <div className="flex h-full max-h-full w-64 shrink-0 flex-col overflow-hidden rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-4 shadow-sm">
      <h2 className="mb-3 shrink-0 text-sm font-semibold text-neutral-700 dark:text-neutral-200">
        Folders
      </h2>

      {/* This is the only scrolling region. min-h-0 + basis-0 force it to actually
          shrink instead of growing to fit every folder button. */}
      <div className="min-h-0 flex-1 basis-0 overflow-y-auto pr-1">
        <div className="flex flex-col gap-2">
          {loading ? (
            <p className="text-xs text-neutral-400 dark:text-neutral-500">Loading folders…</p>
          ) : folders.length === 0 ? (
            <p className="text-xs text-neutral-400 dark:text-neutral-500">No folders yet</p>
          ) : (
            folders.map((folder) => (
              <button
                key={folder.id}
                type="button"
                onClick={() => onSelectFolder(folder)}
                disabled={disabled}
                className="shrink-0 truncate rounded-lg border border-neutral-200 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-700 px-3 py-2 text-left text-sm text-neutral-700 dark:text-neutral-200 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-600 hover:border-neutral-300 dark:hover:border-neutral-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {movingFolderPath === folder.path ? "Moving…" : folder.name}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Pinned footer: never scrolls away, regardless of folder count. */}
      <div className="mt-3 flex shrink-0 flex-col gap-2 border-t border-neutral-100 dark:border-neutral-700 pt-3">
        <input
          type="text"
          value={newFolderName}
          onChange={(e) => onNewFolderNameChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="New folder name"
          disabled={isCreatingFolder}
          className="w-full rounded-lg border border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-700 px-3 py-2 text-sm text-neutral-800 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-300 dark:focus:ring-neutral-600 disabled:opacity-60"
        />
        <button
          type="button"
          onClick={onCreateFolder}
          disabled={!newFolderName.trim() || isCreatingFolder}
          className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 px-3 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-300 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isCreatingFolder ? "Creating…" : "Create folder"}
        </button>
      </div>
    </div>
  );
};

export default FolderList;
