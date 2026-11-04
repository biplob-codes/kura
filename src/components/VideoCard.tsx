import { invoke } from "@tauri-apps/api/core";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, FolderInput, Trash2, X } from "lucide-react";
import { VideoCard } from "../pages/Home";
import { formatDuration, formatFileSize } from "../utils/files";
import { DEFAULT_THUMBNAIL, thumbnailSrc } from "./mediaUrl";

export type VideoContextAction = {
  id: string;
  label: string;
  icon?: ReactNode;
  danger?: boolean;
  onSelect: () => void | Promise<void>;
};

interface LibraryFolder {
  id: string | null;
  name: string;
  path: string;
}

export function VideoCardItem({
  video,
  currentFolderId,
  onDeleted,
  onMoved,
  extraActions = [],
}: {
  video: VideoCard;
  /** When set, that folder is disabled in the move picker */
  currentFolderId?: string;
  onDeleted?: (videoId: string) => void;
  /** Called after a successful move (parent can remove the card from the current list) */
  onMoved?: (videoId: string, newFolderId: string) => void;
  extraActions?: VideoContextAction[];
}) {
  const [playError, setPlayError] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const [pending, setPending] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isDeleted = video.is_deleted === true;

  useEffect(() => {
    if (!menuOpen) return;

    function onPointerDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  async function handlePlay() {
    if (playing || isDeleted || pending) return;
    setPlayError(null);
    setPlaying(true);
    try {
      await invoke("play_video", { videoId: video.id });
    } catch (err) {
      setPlayError(String(err));
    } finally {
      setPlaying(false);
    }
  }

  function openContextMenu(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (isDeleted || pending) return;
    setMenuPos({ x: e.clientX, y: e.clientY });
    setMenuOpen(true);
  }

  async function handlePermanentDelete() {
    if (pending || isDeleted) return;
    setPending(true);
    setMenuOpen(false);
    try {
      await invoke("permanently_delete_video", { videoId: video.id });
      onDeleted?.(video.id);
    } catch (err) {
      console.error("Couldn't permanently delete video:", err);
      setPlayError(String(err));
    } finally {
      setPending(false);
    }
  }

  function openMoveModal() {
    setMenuOpen(false);
    setMoveOpen(true);
  }

  async function handleMoveToFolder(folderId: string) {
    if (pending || isDeleted) return;
    if (currentFolderId && folderId === currentFolderId) return;

    setPending(true);
    try {
      await invoke("move_video_to_folder", {
        videoId: video.id,
        folderId,
      });
      setMoveOpen(false);
      onMoved?.(video.id, folderId);
    } catch (err) {
      console.error("Couldn't move video:", err);
      setPlayError(String(err));
    } finally {
      setPending(false);
    }
  }

  const actions: VideoContextAction[] = [
    ...extraActions,
    {
      id: "move",
      label: "Move to folder…",
      icon: (
        <FolderInput
          size={16}
          strokeWidth={2}
          className="shrink-0 text-neutral-500 dark:text-white/50"
        />
      ),
      onSelect: openMoveModal,
    },
    {
      id: "delete-permanently",
      label: pending ? "Deleting…" : "Delete permanently",
      icon: (
        <Trash2
          size={16}
          strokeWidth={2}
          className="shrink-0 text-red-500 dark:text-red-400/80"
        />
      ),
      danger: true,
      onSelect: handlePermanentDelete,
    },
  ];

  return (
    <div className="group relative block" onContextMenu={openContextMenu}>
      <button
        type="button"
        onClick={handlePlay}
        disabled={playing || isDeleted || pending}
        className="w-full cursor-pointer text-left disabled:cursor-default disabled:opacity-70"
      >
        <div className="relative aspect-video w-full overflow-hidden rounded-md bg-neutral-200 dark:bg-neutral-800">
          <Thumbnail path={video.thumbnail_path} title={video.title} />

          {isDeleted && (
            <span
              className="absolute left-1.5 top-1.5 flex items-center justify-center text-green-600 dark:text-green-400"
              title="Deleted"
              aria-label="Deleted"
            >
              <Check size={18} strokeWidth={2.5} />
            </span>
          )}

          <span className="absolute bottom-1.5 right-1.5 rounded bg-black/75 px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-white">
            {formatDuration(video.duration_seconds)}
          </span>
        </div>

        <div className="mt-2 px-0.5">
          <p
            className="truncate text-center text-[13px] font-medium text-neutral-900 dark:text-white/90"
            title={video.title}
          >
            {video.title}
          </p>
          <p className="mt-0.5 truncate text-center text-[11px] text-neutral-500 dark:text-white/45">
            {formatFileSize(video.size_bytes)}
          </p>
        </div>
      </button>

      {playError && (
        <p className="mt-1 px-0.5 text-center text-[11px] text-red-500 dark:text-red-400/90">
          {playError}
        </p>
      )}

      {menuOpen && (
        <div
          ref={menuRef}
          className="fixed z-50 min-w-[200px] overflow-hidden rounded-xl bg-white py-1 shadow-2xl ring-1 ring-black/10 dark:bg-[#1c1c1e] dark:ring-white/10"
          style={{ left: menuPos.x, top: menuPos.y }}
        >
          {actions.map((action) => (
            <button
              key={action.id}
              type="button"
              disabled={pending}
              onClick={() => void action.onSelect()}
              className={[
                "flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-[13px] transition-colors hover:bg-black/5 disabled:opacity-50 cursor-pointer dark:hover:bg-white/5",
                action.danger
                  ? "text-red-500 dark:text-red-400/90"
                  : "text-neutral-800 dark:text-white/85",
              ].join(" ")}
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>
      )}

      {moveOpen && (
        <MoveFolderModal
          currentFolderId={currentFolderId}
          busy={pending}
          onClose={() => {
            if (!pending) setMoveOpen(false);
          }}
          onSelect={handleMoveToFolder}
        />
      )}
    </div>
  );
}

function MoveFolderModal({
  currentFolderId,
  busy,
  onClose,
  onSelect,
}: {
  currentFolderId?: string;
  busy: boolean;
  onClose: () => void;
  onSelect: (folderId: string) => void;
}) {
  const [folders, setFolders] = useState<LibraryFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    invoke<LibraryFolder[]>("get_library_folders")
      .then((result) => {
        if (cancelled) return;
        setFolders(result.filter((f) => f.id != null));
      })
      .catch((err) => {
        if (!cancelled) setError(String(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !busy) onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [busy, onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]"
      onClick={() => {
        if (!busy) onClose();
      }}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/10 dark:bg-[#1c1c1e] dark:ring-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-black/5 px-4 py-3 dark:border-white/10">
          <h2 className="text-[15px] font-semibold text-neutral-900 dark:text-white/90">
            Move to folder
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-500 transition hover:bg-black/5 hover:text-neutral-800 disabled:opacity-40 dark:text-white/50 dark:hover:bg-white/10 dark:hover:text-white"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[50vh] overflow-y-auto p-3">
          {loading && (
            <p className="px-1 py-6 text-center text-sm text-neutral-500 dark:text-white/45">
              Loading folders…
            </p>
          )}

          {error && (
            <p className="px-1 py-6 text-center text-sm text-red-500 dark:text-red-400/90">
              {error}
            </p>
          )}

          {!loading && !error && folders.length === 0 && (
            <p className="px-1 py-6 text-center text-sm text-neutral-500 dark:text-white/45">
              No folders yet
            </p>
          )}

          {!loading && !error && folders.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {folders.map((folder) => {
                const id = folder.id as string;
                const isCurrent = currentFolderId === id;
                return (
                  <button
                    key={id}
                    type="button"
                    disabled={busy || isCurrent}
                    onClick={() => onSelect(id)}
                    className={[
                      "truncate rounded-xl px-3 py-3 text-left text-[13px] font-medium transition-colors",
                      isCurrent
                        ? "cursor-default bg-black/5 text-neutral-400 dark:bg-white/5 dark:text-white/35"
                        : "bg-black/[0.04] text-neutral-800 hover:bg-black/10 dark:bg-white/[0.06] dark:text-white/85 dark:hover:bg-white/10",
                      busy ? "opacity-60" : "",
                    ].join(" ")}
                    title={isCurrent ? "Current folder" : folder.name}
                  >
                    {folder.name}
                    {isCurrent && (
                      <span className="mt-0.5 block text-[11px] font-normal text-neutral-400 dark:text-white/35">
                        Current
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Thumbnail({ path, title }: { path: string | null; title: string }) {
  const [failed, setFailed] = useState(false);
  const src = failed ? DEFAULT_THUMBNAIL : thumbnailSrc(path);

  useEffect(() => {
    setFailed(false);
  }, [path]);

  return (
    <img
      src={src}
      alt={title}
      className="aspect-video w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
      onError={() => {
        if (!failed) setFailed(true);
      }}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="block">
      <div className="aspect-video w-full animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-800" />
      <div className="mt-2 space-y-1 px-0.5">
        <div className="mx-auto h-3.5 w-4/5 rounded bg-neutral-200 dark:bg-neutral-800" />
        <div className="mx-auto h-3 w-1/3 rounded bg-neutral-200 dark:bg-neutral-800" />
      </div>
    </div>
  );
}
