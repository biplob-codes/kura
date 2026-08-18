import { useEffect, useState, KeyboardEvent } from "react";
import { invoke } from "@tauri-apps/api/core";
import { File } from "../pages/Transfer";
import { formatFileSize } from "../utils/files";

export interface Tag {
  id: string;
  name: string;
}

interface Props {
  file: File;
  currentIndex: number;
  numberOfFiles: number;
  onSkip: () => void;
  hasNext: boolean;
  isMoving: boolean;
  loading: boolean;
  selectedTagIds: string[];
  onToggleTag: (tagId: string) => void;
}

const TransferMetadata = ({
  file,
  currentIndex,
  numberOfFiles,
  hasNext,
  isMoving,
  loading,
  onSkip,
  selectedTagIds,
  onToggleTag,
}: Props) => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loadingTags, setLoadingTags] = useState(true);
  const [newTagName, setNewTagName] = useState("");
  const [isCreatingTag, setIsCreatingTag] = useState(false);

  useEffect(() => {
    invoke<Tag[]>("get_tags")
      .then((res) => setTags(res))
      .catch((err) => console.error("Failed to load tags:", err))
      .finally(() => setLoadingTags(false));
  }, []);

  const handleCreateTag = async () => {
    const name = newTagName.trim();
    if (!name || isCreatingTag) return;

    setIsCreatingTag(true);
    try {
      const created = await invoke<Tag>("create_tag", { name });
      setTags((prev) =>
        [...prev, created].sort((a, b) => a.name.localeCompare(b.name)),
      );
      setNewTagName("");
    } catch (err) {
      console.error("Failed to create tag:", err);
    } finally {
      setIsCreatingTag(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCreateTag();
    }
  };

  return (
    <div className="rounded-md border border-neutral-200 bg-white p-4 shadow-sm">
      {file ? (
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-neutral-800">
              {file.name}
            </p>
            <p className="mt-1 text-xs text-neutral-400">
              {formatFileSize(file.size)} · {currentIndex + 1} of{" "}
              {numberOfFiles}
            </p>
          </div>

          <button
            type="button"
            onClick={onSkip}
            disabled={!hasNext || isMoving}
            className="shrink-0 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
          >
            Skip
          </button>
        </div>
      ) : (
        <p className="text-sm text-neutral-400">
          {loading ? "Loading metadata…" : "Nothing to show"}
        </p>
      )}

      <div className="mt-4 border-t border-neutral-100 pt-4">
        <div className="flex flex-wrap gap-2">
          {loadingTags ? (
            <p className="text-xs text-neutral-400">Loading tags…</p>
          ) : tags.length === 0 ? (
            <p className="text-xs text-neutral-400">No tags yet</p>
          ) : (
            tags.map((tag) => {
              const isSelected = selectedTagIds.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => onToggleTag(tag.id)}
                  className={`cursor-pointer rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                    isSelected
                      ? "border-neutral-800 bg-neutral-800 text-white"
                      : "border-neutral-200 bg-neutral-50 text-neutral-600 hover:bg-neutral-100"
                  }`}
                >
                  {tag.name}
                </button>
              );
            })
          )}
        </div>

        <div className="mt-3 flex items-center gap-2">
          <input
            type="text"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="New tag name"
            disabled={isCreatingTag}
            className="min-w-0 flex-1 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-300 disabled:opacity-60"
          />
          <button
            type="button"
            onClick={handleCreateTag}
            disabled={!newTagName.trim() || isCreatingTag}
            className="shrink-0 rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
          >
            {isCreatingTag ? "Creating…" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransferMetadata;
