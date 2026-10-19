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
    <div className="flex h-full w-60 shrink-0 flex-col overflow-hidden">
      <p className="mb-3 shrink-0 px-1 text-[15px] font-semibold text-white/75">
        Folders
      </p>

      <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin]">
        <div className="flex flex-col gap-0.5">
          {loading ? (
            <p className="px-1 text-sm text-white/40">Loading folders…</p>
          ) : folders.length === 0 ? (
            <p className="px-1 text-sm text-white/40">No folders yet</p>
          ) : (
            folders.map((folder) => (
              <button
                key={folder.id}
                type="button"
                onClick={() => onSelectFolder(folder)}
                disabled={disabled}
                className="flex shrink-0 items-center gap-2.5 truncate rounded-lg px-2.5 py-2 text-left text-[14.5px] text-white/80 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <FolderIcon
                  size={18}
                  strokeWidth={1.75}
                  className="shrink-0 text-white/55"
                />
                <span className="truncate font-medium">
                  {movingFolderPath === folder.path ? "Moving…" : folder.name}
                </span>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="mt-3 flex shrink-0 flex-col gap-2 pt-2">
        <input
          type="text"
          value={newFolderName}
          onChange={(e) => onNewFolderNameChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="New folder name"
          disabled={isCreatingFolder}
          className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-[14px] text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-white/30 disabled:opacity-60"
        />
        <button
          type="button"
          onClick={onCreateFolder}
          disabled={!newFolderName.trim() || isCreatingFolder}
          className="w-full rounded-lg px-3 py-2 text-[14px] font-medium text-white/75 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isCreatingFolder ? "Creating…" : "Create folder"}
        </button>
      </div>
    </div>
  );
};

export default FolderList;
