import { KeyboardEvent } from "react";
import { Folder as FolderIcon, Plus } from "lucide-react";

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
    <div className="flex h-full max-h-full w-[240px] shrink-0 flex-col overflow-hidden rounded-[12px] border border-black/[0.06] dark:border-white/[0.08] bg-white/90 dark:bg-[#2c2c2e]/90 backdrop-blur-sm shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <div className="shrink-0 px-3.5 pt-3.5 pb-2">
        <h2 className="text-[13px] font-semibold tracking-[-0.01em] text-[#1d1d1f] dark:text-[#f5f5f7]">
          Folders
        </h2>
        <p className="text-[11px] text-[#86868b] dark:text-[#98989d]">
          Click to file this video
        </p>
      </div>

      <div className="min-h-0 flex-1 basis-0 overflow-y-auto px-2 pb-2">
        <div className="flex flex-col gap-0.5">
          {loading ? (
            <p className="px-2 py-3 text-[12px] text-[#86868b]">Loading…</p>
          ) : folders.length === 0 ? (
            <p className="px-2 py-3 text-[12px] text-[#86868b]">No folders yet</p>
          ) : (
            folders.map((folder) => {
              const isMoving = movingFolderPath === folder.path;
              return (
                <button
                  key={folder.id}
                  type="button"
                  onClick={() => onSelectFolder(folder)}
                  disabled={disabled}
                  className={[
                    "flex items-center gap-2.5 shrink-0 truncate rounded-[8px] px-2.5 py-2 text-left text-[13px] transition-colors cursor-pointer",
                    "text-[#1d1d1f] dark:text-[#f5f5f7]",
                    "hover:bg-[#007AFF]/12 dark:hover:bg-[#0A84FF]/20",
                    "disabled:cursor-not-allowed disabled:opacity-40",
                    isMoving ? "bg-[#007AFF]/15 dark:bg-[#0A84FF]/25" : "",
                  ].join(" ")}
                >
                  <FolderIcon
                    size={15}
                    strokeWidth={1.75}
                    className="shrink-0 text-[#007AFF] dark:text-[#0A84FF]"
                  />
                  <span className="truncate font-medium">
                    {isMoving ? "Moving…" : folder.name}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="mt-auto flex shrink-0 flex-col gap-2 border-t border-black/[0.06] dark:border-white/[0.08] px-3 py-3">
        <input
          type="text"
          value={newFolderName}
          onChange={(e) => onNewFolderNameChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="New folder name"
          disabled={isCreatingFolder}
          className="w-full rounded-[8px] border border-black/[0.08] dark:border-white/[0.1] bg-[#f5f5f7] dark:bg-[#1c1c1e] px-3 py-2 text-[13px] text-[#1d1d1f] dark:text-[#f5f5f7] placeholder:text-[#86868b] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/40 disabled:opacity-60"
        />
        <button
          type="button"
          onClick={onCreateFolder}
          disabled={!newFolderName.trim() || isCreatingFolder}
          className="flex w-full items-center justify-center gap-1.5 rounded-[8px] bg-[#007AFF] dark:bg-[#0A84FF] px-3 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
        >
          <Plus size={14} strokeWidth={2.5} />
          {isCreatingFolder ? "Creating…" : "New Folder"}
        </button>
      </div>
    </div>
  );
};

export default FolderList;
