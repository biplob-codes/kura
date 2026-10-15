import { KeyboardEvent } from "react";
import { Folder as FolderIcon } from "lucide-react";

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

  return (
    <div className="flex h-full w-56 shrink-0 flex-col overflow-hidden">
      <p className="mb-2.5 shrink-0 px-1 text-sm font-semibold text-white/70">
        Folders
      </p>

      <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin]">
        <div className="flex flex-col gap-0.5">
          {loading ? (
            <p className="px-1 text-xs text-white/40">Loading folders…</p>
          ) : folders.length === 0 ? (
            <p className="px-1 text-xs text-white/40">No folders yet</p>
          ) : (
            folders.map((folder) => (
              <button
                key={folder.id}
                type="button"
                onClick={() => onSelectFolder(folder)}
                disabled={disabled}
                className="flex shrink-0 items-center gap-2 truncate rounded px-2 py-1.5 text-left text-[13.5px] text-white/80 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <FolderIcon
                  size={15}
                  strokeWidth={1.75}
                  className="shrink-0 text-white/50"
                />
                <span className="truncate">
                  {movingFolderPath === folder.path ? "Moving…" : folder.name}
                </span>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="mt-2 flex shrink-0 flex-col gap-1.5 pt-2">
        <input
          type="text"
          value={newFolderName}
          onChange={(e) => onNewFolderNameChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="New folder name"
          disabled={isCreatingFolder}
          className="w-full rounded border border-white/15 bg-white/5 px-2.5 py-1.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-white/30 disabled:opacity-60"
        />
        <button
          type="button"
          onClick={onCreateFolder}
          disabled={!newFolderName.trim() || isCreatingFolder}
          className="w-full rounded px-2.5 py-1.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isCreatingFolder ? "Creating…" : "Create folder"}
        </button>
      </div>
    </div>
  );
};

export default FolderList;
