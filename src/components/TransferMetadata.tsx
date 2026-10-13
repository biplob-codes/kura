import { useEffect, useState, KeyboardEvent } from "react";
import { invoke } from "@tauri-apps/api/core";
import { File } from "../pages/Transfer";
import { formatFileSize } from "../utils/files";

export interface Tag {
  id: string;
  name: string;
}

export interface Model {
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
  selectedModelIds: string[];
  onToggleModel: (modelId: string) => void;
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
  selectedModelIds,
  onToggleModel,
}: Props) => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loadingTags, setLoadingTags] = useState(true);
  const [newTagName, setNewTagName] = useState("");
  const [isCreatingTag, setIsCreatingTag] = useState(false);

  const [models, setModels] = useState<Model[]>([]);
  const [loadingModels, setLoadingModels] = useState(true);
  const [newModelName, setNewModelName] = useState("");
  const [isCreatingModel, setIsCreatingModel] = useState(false);

  useEffect(() => {
    invoke<Tag[]>("get_tags")
      .then((res) => setTags(res))
      .catch((err) => console.error("Failed to load tags:", err))
      .finally(() => setLoadingTags(false));

    invoke<Model[]>("get_models")
      .then((res) => setModels(res))
      .catch((err) => console.error("Failed to load models:", err))
      .finally(() => setLoadingModels(false));
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

  const handleCreateModel = async () => {
    const name = newModelName.trim();
    if (!name || isCreatingModel) return;

    setIsCreatingModel(true);
    try {
      const created = await invoke<Model>("create_model", { name });
      setModels((prev) =>
        [...prev, created].sort((a, b) => a.name.localeCompare(b.name)),
      );
      setNewModelName("");
    } catch (err) {
      console.error("Failed to create model:", err);
    } finally {
      setIsCreatingModel(false);
    }
  };

  const handleTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCreateTag();
    }
  };

  const handleModelKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCreateModel();
    }
  };

  const chipBase =
    "cursor-pointer rounded-md border px-2 py-1 text-xs transition-colors";
  const chipSelected =
    "border-neutral-800 dark:border-neutral-200 bg-neutral-800 dark:bg-neutral-200 text-white dark:text-neutral-900";
  const chipIdle =
    "border-neutral-200 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-600";

  const inputClass =
    "min-w-0 flex-1 rounded-md border border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-700 px-2.5 py-1.5 text-xs text-neutral-800 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-300 dark:focus:ring-neutral-600 disabled:opacity-60";

  const btnClass =
    "shrink-0 rounded-md border border-neutral-300 dark:border-neutral-600 px-2.5 py-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-300 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer";

  return (
    <div className="rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-3 shadow-sm">
      {file ? (
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-neutral-800 dark:text-neutral-100">
              {file.name}
            </p>
            <p className="mt-0.5 text-[11px] text-neutral-400 dark:text-neutral-500">
              {formatFileSize(file.size)} · {currentIndex + 1} of{" "}
              {numberOfFiles}
            </p>
          </div>

          <button
            type="button"
            onClick={onSkip}
            disabled={!hasNext || isMoving}
            className="shrink-0 rounded-md border border-neutral-200 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-700 px-2.5 py-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-300 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-600 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
          >
            Skip
          </button>
        </div>
      ) : (
        <p className="text-xs text-neutral-400 dark:text-neutral-500">
          {loading ? "Loading metadata…" : "Nothing to show"}
        </p>
      )}

      {/* Models section */}
      <div className="mt-3 border-t border-neutral-100 dark:border-neutral-700 pt-3">
        <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
          Models
        </p>
        <div className="flex flex-wrap gap-1.5">
          {loadingModels ? (
            <p className="text-[11px] text-neutral-400 dark:text-neutral-500">
              Loading models…
            </p>
          ) : models.length === 0 ? (
            <p className="text-[11px] text-neutral-400 dark:text-neutral-500">
              No models yet
            </p>
          ) : (
            models.map((model) => {
              const isSelected = selectedModelIds.includes(model.id);
              return (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => onToggleModel(model.id)}
                  className={`${chipBase} ${isSelected ? chipSelected : chipIdle}`}
                >
                  {model.name}
                </button>
              );
            })
          )}
        </div>

        <div className="mt-2 flex items-center gap-1.5">
          <input
            type="text"
            value={newModelName}
            onChange={(e) => setNewModelName(e.target.value)}
            onKeyDown={handleModelKeyDown}
            placeholder="New model name"
            disabled={isCreatingModel}
            className={inputClass}
          />
          <button
            type="button"
            onClick={handleCreateModel}
            disabled={!newModelName.trim() || isCreatingModel}
            className={btnClass}
          >
            {isCreatingModel ? "Creating…" : "Create"}
          </button>
        </div>
      </div>

      {/* Tags section */}
      <div className="mt-3 border-t border-neutral-100 dark:border-neutral-700 pt-3">
        <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
          Tags
        </p>
        <div className="flex flex-wrap gap-1.5">
          {loadingTags ? (
            <p className="text-[11px] text-neutral-400 dark:text-neutral-500">
              Loading tags…
            </p>
          ) : tags.length === 0 ? (
            <p className="text-[11px] text-neutral-400 dark:text-neutral-500">
              No tags yet
            </p>
          ) : (
            tags.map((tag) => {
              const isSelected = selectedTagIds.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => onToggleTag(tag.id)}
                  className={`${chipBase} ${isSelected ? chipSelected : chipIdle}`}
                >
                  {tag.name}
                </button>
              );
            })
          )}
        </div>

        <div className="mt-2 flex items-center gap-1.5">
          <input
            type="text"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            onKeyDown={handleTagKeyDown}
            placeholder="New tag name"
            disabled={isCreatingTag}
            className={inputClass}
          />
          <button
            type="button"
            onClick={handleCreateTag}
            disabled={!newTagName.trim() || isCreatingTag}
            className={btnClass}
          >
            {isCreatingTag ? "Creating…" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransferMetadata;
