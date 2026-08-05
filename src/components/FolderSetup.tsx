import { useEffect, useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { ChevronDown, Folder } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";

type FolderKey = "inbox" | "library";

export interface FolderPaths {
  inboxPath: string;
  libraryPath: string;
}

// Cross-platform-ish basename: last segment after / or \
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

export default function FolderSetup() {
  const [paths, setPaths] = useState<Record<FolderKey, string | null>>({
    inbox: null,
    library: null,
  });
  const getDirectories = () => {
    invoke<Record<FolderKey, string | null>>("get_directories").then((res) =>
      setPaths(res),
    );
  };
  const [error, setError] = useState<string | null>(null);

  async function handlePick(key: FolderKey) {
    setError(null);
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: FOLDER_META[key].dialogTitle,
      });

      // `open` returns string | string[] | null depending on options/platform
      const path = Array.isArray(selected) ? selected[0] : selected;
      if (!path) return;
      await invoke<Record<FolderKey, string | null>>("update_directories", {
        folder: key,
        folderPath: path,
      });
      getDirectories();
    } catch (err) {
      console.error(`Failed to open folder picker for ${key}:`, err);
      setError("Couldn't open the folder picker. Please try again.");
    }
  }
  useEffect(() => {
    getDirectories();
  }, []);

  return (
    <div className="w-full flex items-center justify-center mt-5">
      <div className="w-full">
        <div className="mt-2 rounded-lg border border-gray-200 divide-y divide-gray-200 overflow-hidden bg-gray-50/60">
          {(["inbox", "library"] as FolderKey[]).map((key) => {
            const meta = FOLDER_META[key];
            const path = paths[key];
            return (
              <div
                key={key}
                className="flex items-center justify-between gap-4 px-4 py-3.5 bg-white"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-900">
                    {meta.label}
                  </div>
                  <div className="text-xs text-gray-500">{meta.hint}</div>
                </div>

                <button
                  type="button"
                  onClick={() => handlePick(key)}
                  className="shrink-0 flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-100 hover:bg-gray-200 transition-colors px-3 py-1.5 text-sm text-gray-700 max-w-[55%]"
                >
                  <Folder className="w-4 h-4 text-gray-500 shrink-0" />
                  <span className="truncate">
                    {path ? basename(path) : "Select folder"}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                </button>
              </div>
            );
          })}
        </div>

        {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
      </div>
    </div>
  );
}
