import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Link } from "react-router-dom";
import { ListVideo, Plus, X } from "lucide-react";

export interface Playlist {
  id: string;
  name: string;
  created_at: string;
  video_count: number;
}

export default function Watchlist() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function loadPlaylists() {
    setLoading(true);
    invoke<Playlist[]>("get_playlists")
      .then(setPlaylists)
      .catch((err) => setError(String(err)))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadPlaylists();
  }, []);

  useEffect(() => {
    if (modalOpen) {
      setName("");
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [modalOpen]);

  async function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed || creating) return;
    setCreating(true);
    try {
      const created = await invoke<Playlist>("create_playlist", {
        name: trimmed,
      });
      setPlaylists((prev) => [created, ...prev]);
      setModalOpen(false);
    } catch (err) {
      console.error("Couldn't create playlist:", err);
    } finally {
      setCreating(false);
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCreate();
    } else if (e.key === "Escape") {
      setModalOpen(false);
    }
  }

  if (error) {
    return (
      <div className="p-5">
        <div className="rounded-xl bg-black/40 p-6 text-sm text-white/60">
          <p className="font-medium text-white/90">Couldn't load playlists</p>
          <p className="mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto px-5 pt-4 pb-8">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-white/90">Playlists</h1>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-2 text-sm font-medium text-black transition-colors hover:bg-white/90 cursor-pointer"
        >
          <Plus size={16} strokeWidth={2.25} />
          Create new playlist
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-white/5" />
          ))}
        </div>
      ) : playlists.length === 0 ? (
        <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 text-sm text-white/40">
          <p>No playlists yet</p>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="text-white/70 underline-offset-2 hover:text-white hover:underline cursor-pointer"
          >
            Create your first playlist
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {playlists.map((pl) => (
            <Link
              key={pl.id}
              to={`/playlists/${pl.id}`}
              className="group flex flex-col justify-between rounded-xl bg-white/5 p-4 transition-colors hover:bg-white/10"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white/70 group-hover:text-white">
                <ListVideo size={20} strokeWidth={1.75} />
              </div>
              <div>
                <p className="truncate text-sm font-medium text-white/90 group-hover:text-white">
                  {pl.name}
                </p>
                <p className="mt-0.5 text-xs text-white/40">
                  {pl.video_count} {pl.video_count === 1 ? "video" : "videos"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !creating && setModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-sm rounded-xl bg-[#1c1c1e] p-5 shadow-2xl ring-1 ring-white/10">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-white/95">
                New playlist
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                disabled={creating}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50 transition-colors hover:bg-white/10 hover:text-white cursor-pointer disabled:opacity-40"
              >
                <X size={16} />
              </button>
            </div>
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Playlist name"
              disabled={creating}
              className="w-full rounded-lg bg-white/5 px-3 py-2.5 text-sm text-white/90 placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/20 disabled:opacity-60"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                disabled={creating}
                className="rounded-lg bg-white/5 px-3.5 py-2 text-sm font-medium text-white/60 transition-colors hover:bg-white/10 hover:text-white cursor-pointer disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={!name.trim() || creating}
                className="rounded-lg bg-white px-3.5 py-2 text-sm font-medium text-black transition-colors hover:bg-white/90 disabled:opacity-40 cursor-pointer"
              >
                {creating ? "Creating…" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
