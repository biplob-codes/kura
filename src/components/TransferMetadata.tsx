import { useEffect, useState, KeyboardEvent, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Plus } from "lucide-react";
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
  file: File | undefined;
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
  const [showTagInput, setShowTagInput] = useState(false);
  const tagInputRef = useRef<HTMLInputElement>(null);

  const [models, setModels] = useState<Model[]>([]);
  const [loadingModels, setLoadingModels] = useState(true);
  const [newModelName, setNewModelName] = useState("");
  const [isCreatingModel, setIsCreatingModel] = useState(false);
  const [showModelInput, setShowModelInput] = useState(false);
  const modelInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (showModelInput) modelInputRef.current?.focus();
  }, [showModelInput]);

  useEffect(() => {
    if (showTagInput) tagInputRef.current?.focus();
  }, [showTagInput]);

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
      setShowTagInput(false);
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
      setShowModelInput(false);
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
    } else if (e.key === "Escape") {
      setNewTagName("");
      setShowTagInput(false);
    }
  };

  const handleModelKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCreateModel();
    } else if (e.key === "Escape") {
      setNewModelName("");
      setShowModelInput(false);
    }
  };

  const chipBase =
    "cursor-pointer rounded-full px-2.5 py-1 text-[12px] font-medium transition-colors";
  const chipSelected =
    "bg-[#007AFF] dark:bg-[#0A84FF] text-white";
  const chipIdle =
    "bg-[#f0f0f2] dark:bg-[#3a3a3c] text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-[#e5e5ea] dark:hover:bg-[#48484a]";
  const chipAdd =
    "cursor-pointer rounded-full border border-dashed border-black/[0.15] dark:border-white/[0.2] bg-transparent px-2 py-1 text-[12px] text-[#86868b] hover:bg-[#f0f0f2] dark:hover:bg-[#3a3a3c] transition-colors inline-flex items-center gap-0.5";

  const inputClass =
    "min-w-0 flex-1 rounded-[8px] border border-black/[0.08] dark:border-white/[0.1] bg-[#f5f5f7] dark:bg-[#1c1c1e] px-2.5 py-1.5 text-[12px] text-[#1d1d1f] dark:text-[#f5f5f7] placeholder:text-[#86868b] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/40 disabled:opacity-60";

  const btnClass =
    "shrink-0 rounded-[8px] border border-black/[0.08] dark:border-white/[0.1] px-2.5 py-1.5 text-[12px] font-medium text-[#1d1d1f] dark:text-[#f5f5f7] transition-colors hover:bg-[#f0f0f2] dark:hover:bg-[#3a3a3c] disabled:opacity-40 cursor-pointer";

  return (
    <div className="rounded-[12px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#2c2c2e] p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      {file ? (
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold tracking-[-0.01em] text-[#1d1d1f] dark:text-[#f5f5f7]">
              {file.name}
            </p>
            <p className="mt-0.5 text-[11px] text-[#86868b] dark:text-[#98989d]">
              {formatFileSize(file.size)} · {currentIndex + 1} of {numberOfFiles}
            </p>
          </div>

          <button
            type="button"
            onClick={onSkip}
            disabled={!hasNext || isMoving}
            className="shrink-0 rounded-[8px] border border-black/[0.08] dark:border-white/[0.1] bg-[#f5f5f7] dark:bg-[#3a3a3c] px-3 py-1.5 text-[12px] font-medium text-[#1d1d1f] dark:text-[#f5f5f7] transition-colors hover:bg-[#e8e8ed] dark:hover:bg-[#48484a] disabled:opacity-40 cursor-pointer"
          >
            Skip
          </button>
        </div>
      ) : (
        <p className="text-[12px] text-[#86868b]">
          {loading ? "Loading metadata…" : "Nothing to show"}
        </p>
      )}

      <div className="mt-3 border-t border-black/[0.06] dark:border-white/[0.08] pt-3">
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#86868b] dark:text-[#98989d]">
          Models
        </p>
        <div className="flex flex-wrap items-center gap-1.5">
          {loadingModels ? (
            <p className="text-[11px] text-[#86868b]">Loading models…</p>
          ) : (
            <>
              {models.map((model) => {
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
              })}
              {!showModelInput && (
                <button
                  type="button"
                  onClick={() => setShowModelInput(true)}
                  className={chipAdd}
                  title="Add model"
                >
                  <Plus size={12} strokeWidth={2.5} />
                </button>
              )}
            </>
          )}
        </div>

        {showModelInput && (
          <div className="mt-2 flex items-center gap-1.5">
            <input
              ref={modelInputRef}
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
            <button
              type="button"
              onClick={() => {
                setNewModelName("");
                setShowModelInput(false);
              }}
              disabled={isCreatingModel}
              className={btnClass}
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      <div className="mt-3 border-t border-black/[0.06] dark:border-white/[0.08] pt-3">
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#86868b] dark:text-[#98989d]">
          Tags
        </p>
        <div className="flex flex-wrap items-center gap-1.5">
          {loadingTags ? (
            <p className="text-[11px] text-[#86868b]">Loading tags…</p>
          ) : (
            <>
              {tags.map((tag) => {
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
              })}
              {!showTagInput && (
                <button
                  type="button"
                  onClick={() => setShowTagInput(true)}
                  className={chipAdd}
                  title="Add tag"
                >
                  <Plus size={12} strokeWidth={2.5} />
                </button>
              )}
            </>
          )}
        </div>

        {showTagInput && (
          <div className="mt-2 flex items-center gap-1.5">
            <input
              ref={tagInputRef}
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
            <button
              type="button"
              onClick={() => {
                setNewTagName("");
                setShowTagInput(false);
              }}
              disabled={isCreatingTag}
              className={btnClass}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransferMetadata;
