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
    label: "Inbox",
    hint: "Where unsorted videos land",
    dialogTitle: "Select Inbox Folder",
  },
  library: {
    label: "Library",
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
    <div className="space-y-4">
      {(["inbox", "library"] as FolderKey[]).map((key) => {
        const meta = FOLDER_META[key];
        const path = paths[key];
        return (
          <div key={key} className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[15px] font-medium text-white/90">
                {meta.label}
              </p>
              <p className="mt-0.5 text-sm text-white/45">{meta.hint}</p>
            </div>

            <button
              type="button"
              onClick={() => handlePick(key)}
              className="flex max-w-[55%] shrink-0 items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-sm text-white/80 transition-colors hover:bg-white/10"
            >
              <Folder className="h-4 w-4 shrink-0 text-white/40" />
              <span className="truncate">
                {path ? basename(path) : "Select folder"}
              </span>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-white/40" />
            </button>
          </div>
        );
      })}

      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
