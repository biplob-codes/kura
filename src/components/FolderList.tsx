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
    <div className="flex h-full max-h-full w-64 shrink-0 flex-col overflow-hidden rounded-md border border-neutral-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 shrink-0 text-sm font-semibold text-neutral-700">
        Folders
      </h2>

      {/* This is the only scrolling region. min-h-0 + basis-0 force it to actually
          shrink instead of growing to fit every folder button. */}
      <div className="min-h-0 flex-1 basis-0 overflow-y-auto pr-1">
        <div className="flex flex-col gap-2">
          {loading ? (
            <p className="text-xs text-neutral-400">Loading folders…</p>
          ) : folders.length === 0 ? (
            <p className="text-xs text-neutral-400">No folders yet</p>
          ) : (
            folders.map((folder) => (
              <button
                key={folder.id}
                type="button"
                onClick={() => onSelectFolder(folder)}
                disabled={disabled}
                className="shrink-0 truncate rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-left text-sm text-neutral-700 transition-colors hover:bg-neutral-100 hover:border-neutral-300 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {movingFolderPath === folder.path ? "Moving…" : folder.name}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Pinned footer: never scrolls away, regardless of folder count. */}
      <div className="mt-3 flex shrink-0 flex-col gap-2 border-t border-neutral-100 pt-3">
        <input
          type="text"
          value={newFolderName}
          onChange={(e) => onNewFolderNameChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="New folder name"
          disabled={isCreatingFolder}
          className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-300 disabled:opacity-60"
        />
        <button
          type="button"
          onClick={onCreateFolder}
          disabled={!newFolderName.trim() || isCreatingFolder}
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isCreatingFolder ? "Creating…" : "Create folder"}
        </button>
      </div>
    </div>
  );
};

export default FolderList;
