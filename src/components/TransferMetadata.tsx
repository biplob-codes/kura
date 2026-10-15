import { useEffect, useState, KeyboardEvent, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";

import { File } from "../pages/Transfer";
import { formatFileSize } from "../utils/files";
import { Plus, Tag, Users } from "lucide-react";
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

  // Slightly rounded, not capsule
  const chipBase = "cursor-pointer rounded px-2 py-1 text-xs transition-colors";
  const chipSelected = "bg-white/20 text-white";
  const chipIdle =
    "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white";
  const chipAdd =
    "cursor-pointer rounded border border-dashed border-white/20 bg-transparent px-1.5 py-1 text-xs text-white/50 hover:bg-white/10 hover:text-white transition-colors inline-flex items-center";

  const inputClass =
    "min-w-0 flex-1 rounded border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-white/30 disabled:opacity-60";

  const btnClass =
    "shrink-0 rounded border border-white/15 px-2.5 py-1.5 text-xs font-medium text-white/70 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer";

  return (
    <div className="p-0">
      {file ? (
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white/90">
              {file.name}
            </p>
            <p className="mt-0.5 text-[11px] text-white/45">
              {formatFileSize(file.size)} · {currentIndex + 1} of{" "}
              {numberOfFiles}
            </p>
          </div>

          <button
            type="button"
            onClick={onSkip}
            disabled={!hasNext || isMoving}
            className="shrink-0 rounded px-2.5 py-1.5 text-xs font-medium text-white/70 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
          >
            Skip
          </button>
        </div>
      ) : (
        <p className="text-xs text-white/40">
          {loading ? "Loading metadata…" : "Nothing to show"}
        </p>
      )}

      {/* Models — no heading */}
      <div className="mt-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className="inline-flex items-center text-white/45"
            title="Models"
          >
            <Users size={14} strokeWidth={1.75} />
          </span>
          {loadingModels ? (
            <p className="text-[11px] text-white/40">Loading models…</p>
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

      {/* Tags — no heading */}
      <div className="mt-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center text-white/45" title="Tags">
            <Tag size={14} strokeWidth={1.75} />
          </span>
          {loadingTags ? (
            <p className="text-[11px] text-white/40">Loading tags…</p>
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
