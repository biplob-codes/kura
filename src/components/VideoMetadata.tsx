import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { invoke } from "@tauri-apps/api/core";
import { ListPlus, Plus, Tag as TagIcon, User, X } from "lucide-react";
import { formatFileSize } from "../utils/files";
import type { Video } from "../pages/Video";

interface Playlist {
  id: string;
  name: string;
  created_at: string;
  video_count: number;
}

interface Props {
  video?: Video;
  onWatchedChange: (videoId: string, watched: boolean) => void;
}

function formatDuration(seconds: number | null): string {
  if (seconds == null) return "unknown length";
  const total = Math.round(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

const VideoMetadata = ({ video, onWatchedChange }: Props) => {
  const [updating, setUpdating] = useState(false);

  const [popupOpen, setPopupOpen] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [membership, setMembership] = useState<Set<string>>(new Set());
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const createInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!popupOpen || !video) return;

    setLoadingPlaylists(true);
    setShowCreate(false);
    setNewName("");

    Promise.all([
      invoke<Playlist[]>("get_playlists"),
      invoke<string[]>("get_video_playlist_ids", { videoId: video.id }),
    ])
      .then(([pls, ids]) => {
        setPlaylists(pls);
        setMembership(new Set(ids));
      })
      .catch((err) => console.error("Couldn't load playlists:", err))
      .finally(() => setLoadingPlaylists(false));
  }, [popupOpen, video?.id]);

  useEffect(() => {
    if (showCreate) createInputRef.current?.focus();
  }, [showCreate]);

  async function toggleWatched() {
    if (!video || updating) return;
    const next = !video.watched;

    setUpdating(true);
    try {
      await invoke("set_video_watched", { videoId: video.id, watched: next });
      onWatchedChange(video.id, next);
    } catch (err) {
      console.error("Couldn't update watched status:", err);
    } finally {
      setUpdating(false);
    }
  }

  async function togglePlaylist(playlistId: string) {
    if (!video || togglingId) return;
    setTogglingId(playlistId);
    const isIn = membership.has(playlistId);
    try {
      if (isIn) {
        await invoke("remove_video_from_playlist", {
          playlistId,
          videoId: video.id,
        });
        setMembership((prev) => {
          const next = new Set(prev);
          next.delete(playlistId);
          return next;
        });
      } else {
        await invoke("add_video_to_playlist", {
          playlistId,
          videoId: video.id,
        });
        setMembership((prev) => new Set(prev).add(playlistId));
      }
    } catch (err) {
      console.error("Couldn't update playlist membership:", err);
    } finally {
      setTogglingId(null);
    }
  }

  async function handleCreatePlaylist() {
    const trimmed = newName.trim();
    if (!trimmed || creating || !video) return;
    setCreating(true);
    try {
      const created = await invoke<Playlist>("create_playlist", {
        name: trimmed,
      });
      await invoke("add_video_to_playlist", {
        playlistId: created.id,
        videoId: video.id,
      });
      setPlaylists((prev) => [created, ...prev]);
      setMembership((prev) => new Set(prev).add(created.id));
      setNewName("");
      setShowCreate(false);
    } catch (err) {
      console.error("Couldn't create playlist:", err);
    } finally {
      setCreating(false);
    }
  }

  function onCreateKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCreatePlaylist();
    } else if (e.key === "Escape") {
      setShowCreate(false);
      setNewName("");
    }
  }

  const models = video?.models ?? [];
  const tags = video?.tags ?? [];
  const hasMeta = models.length > 0 || tags.length > 0;

  return (
    <div className="px-5 py-4">
      {video ? (
        <>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold text-white/95">
                {video.title}
              </h1>
              <p className="mt-1 text-sm text-white/45">
                {formatDuration(video.duration_seconds)} ·{" "}
                {formatFileSize(video.size_bytes)}
                {video.width && video.height && (
                  <>
                    {" "}
                    · {video.width}×{video.height}
                  </>
                )}
              </p>
            </div>

            <div className="relative flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setPopupOpen((o) => !o)}
                title="Add to playlist"
                className="flex h-9 items-center gap-1.5 rounded-lg bg-white/5 px-3 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
              >
                <ListPlus size={16} strokeWidth={2} />
                Playlist
              </button>

              <button
                type="button"
                onClick={toggleWatched}
                disabled={updating}
                className={[
                  "shrink-0 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer",
                  video.watched
                    ? "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/80"
                    : "bg-white text-black hover:bg-white/90",
                ].join(" ")}
              >
                {updating
                  ? "Updating…"
                  : video.watched
                    ? "Mark as unwatched"
                    : "Mark as watched"}
              </button>

              {/* Playlist popup */}
              {popupOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setPopupOpen(false)}
                  />
                  <div className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-xl bg-[#1c1c1e] shadow-2xl ring-1 ring-white/10">
                    <div className="flex items-center justify-between border-b border-white/5 px-3 py-2.5">
                      <p className="text-sm font-medium text-white/90">
                        Add to playlist
                      </p>
                      <button
                        type="button"
                        onClick={() => setPopupOpen(false)}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-white/40 hover:bg-white/10 hover:text-white cursor-pointer"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    <div className="max-h-56 overflow-y-auto py-1">
                      {loadingPlaylists ? (
                        <p className="px-3 py-3 text-sm text-white/40">
                          Loading…
                        </p>
                      ) : playlists.length === 0 && !showCreate ? (
                        <p className="px-3 py-3 text-sm text-white/40">
                          No playlists yet
                        </p>
                      ) : (
                        playlists.map((pl) => {
                          const inList = membership.has(pl.id);
                          return (
                            <button
                              key={pl.id}
                              type="button"
                              onClick={() => togglePlaylist(pl.id)}
                              disabled={togglingId === pl.id}
                              className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-white/5 cursor-pointer disabled:opacity-50"
                            >
                              <span
                                className={[
                                  "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                                  inList
                                    ? "border-white bg-white text-black"
                                    : "border-white/30",
                                ].join(" ")}
                              >
                                {inList && (
                                  <svg
                                    viewBox="0 0 12 12"
                                    className="h-2.5 w-2.5"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                  >
                                    <path d="M2 6l3 3 5-5" />
                                  </svg>
                                )}
                              </span>
                              <span className="min-w-0 flex-1 truncate text-sm text-white/85">
                                {pl.name}
                              </span>
                            </button>
                          );
                        })
                      )}
                    </div>

                    <div className="border-t border-white/5 p-2">
                      {showCreate ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            ref={createInputRef}
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            onKeyDown={onCreateKeyDown}
                            placeholder="Playlist name"
                            disabled={creating}
                            className="min-w-0 flex-1 rounded-md bg-white/5 px-2.5 py-1.5 text-xs text-white/90 placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/20"
                          />
                          <button
                            type="button"
                            onClick={handleCreatePlaylist}
                            disabled={!newName.trim() || creating}
                            className="rounded-md bg-white px-2.5 py-1.5 text-xs font-medium text-black hover:bg-white/90 disabled:opacity-40 cursor-pointer"
                          >
                            {creating ? "…" : "Add"}
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowCreate(true)}
                          className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-white/60 transition-colors hover:bg-white/5 hover:text-white cursor-pointer"
                        >
                          <Plus size={15} strokeWidth={2} />
                          Create new playlist
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {hasMeta && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {models.map((model) => (
                <span
                  key={`model-${model.id}`}
                  title={`Model: ${model.name}`}
                  className="inline-flex items-center gap-1 rounded-md bg-white/5 px-2 py-1 text-xs text-white/70"
                >
                  <User
                    size={12}
                    strokeWidth={2}
                    className="shrink-0 text-white/40"
                  />
                  {model.name}
                </span>
              ))}
              {tags.map((tag) => (
                <span
                  key={`tag-${tag.id}`}
                  title={`Tag: ${tag.name}`}
                  className="inline-flex items-center gap-1 rounded-md bg-white/5 px-2 py-1 text-xs text-white/70"
                >
                  <TagIcon
                    size={12}
                    strokeWidth={2}
                    className="shrink-0 text-white/40"
                  />
                  {tag.name}
                </span>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <h1 className="text-base font-semibold text-white/30">
            No video selected
          </h1>
          <p className="mt-1 text-sm text-white/25">— · —</p>
        </>
      )}
    </div>
  );
};

export default VideoMetadata;
