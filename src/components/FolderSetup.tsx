import { useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { ChevronDown, Folder } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { AppConfig } from "../pages/Settings";

type FolderKey = "inbox" | "library";

interface FolderSetupProps {
  inbox: string;
  library: string;
}

function basename(path: string): string {
  const parts = path.split(/[/\\]/).filter(Boolean);
  return parts[parts.length - 1] ?? path;
}

const FOLDER_META: Record<
  FolderKey,
  { label: string; hint: string; dialogTitle: string }
> = {
  inbox: {
    label: "Inbox Folder",
    hint: "Where unsorted videos land",
    dialogTitle: "Select Inbox Folder",
  },
  library: {
    label: "Library Folder",
    hint: "Where sorted videos are kept",
    dialogTitle: "Select Library Folder",
  },
};

export default function FolderSetup({ inbox, library }: FolderSetupProps) {
  const [paths, setPaths] = useState<Record<FolderKey, string | null>>({
    inbox: inbox || null,
    library: library || null,
  });
  const [error, setError] = useState<string | null>(null);

  async function handlePick(key: FolderKey) {
    setError(null);
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: FOLDER_META[key].dialogTitle,
      });

      const path = Array.isArray(selected) ? selected[0] : selected;
      if (!path) return;

      const config = await invoke<AppConfig>("update_directories", {
        folder: key,
        folderPath: path,
      });
      setPaths({
        inbox: config.inbox || null,
        library: config.library || null,
      });
    } catch (err) {
      console.error(`Failed to open folder picker for ${key}:`, err);
      setError("Couldn't open the folder picker. Please try again.");
    }
  }

  return (
    <div className="w-full mt-4">
      <div className="rounded-[12px] border border-black/[0.06] dark:border-white/[0.08] divide-y divide-black/[0.06] dark:divide-white/[0.08] overflow-hidden bg-white dark:bg-[#2c2c2e] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        {(["inbox", "library"] as FolderKey[]).map((key) => {
          const meta = FOLDER_META[key];
          const path = paths[key];
          return (
            <div
              key={key}
              className="flex items-center justify-between gap-4 px-4 py-3.5"
            >
              <div className="min-w-0">
                <div className="text-[13px] font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">
                  {meta.label}
                </div>
                <div className="text-[12px] text-[#86868b] dark:text-[#98989d]">
                  {meta.hint}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handlePick(key)}
                className="shrink-0 flex items-center gap-2 rounded-[8px] border border-black/[0.08] dark:border-white/[0.1] bg-[#f5f5f7] dark:bg-[#3a3a3c] hover:bg-[#e8e8ed] dark:hover:bg-[#48484a] transition-colors px-3 py-1.5 text-[13px] text-[#1d1d1f] dark:text-[#f5f5f7] max-w-[55%] cursor-pointer"
              >
                <Folder className="w-4 h-4 text-[#007AFF] dark:text-[#0A84FF] shrink-0" />
                <span className="truncate">
                  {path ? basename(path) : "Select folder"}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-[#86868b] shrink-0" />
              </button>
            </div>
          );
        })}
      </div>

      {error && (
        <p className="mt-3 text-[12px] text-[#FF3B30] dark:text-[#FF453A]">
          {error}
        </p>
      )}
    </div>
  );
}
