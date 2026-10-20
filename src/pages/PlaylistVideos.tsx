import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import { ChevronLeft } from "lucide-react";
import { VideoCard } from "./Home";
import { CardSkeleton, VideoCardItem } from "../components/VideoCard";

interface PlaylistDetail {
  id: string;
  name: string;
  created_at: string;
}

export default function PlaylistVideos() {
  const { playlistId } = useParams<{ playlistId: string }>();

  const [playlist, setPlaylist] = useState<PlaylistDetail | null>(null);
  const [videos, setVideos] = useState<VideoCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!playlistId) {
      setError("No playlist specified.");
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      invoke<PlaylistDetail>("get_playlist", { playlistId }),
      invoke<VideoCard[]>("get_playlist_videos", { playlistId }),
    ])
      .then(([pl, vids]) => {
        if (cancelled) return;
        setPlaylist(pl);
        setVideos(vids);
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
  }, [playlistId]);

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="rounded-xl bg-black/40 p-6 text-sm text-white/60">
          <p className="font-medium text-white/90">
            Couldn't load this playlist
          </p>
          <p className="mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto px-5 pt-4 pb-8">
      <div className="mb-5">
        <Link
          to="/playlists"
          className="mb-3 inline-flex items-center gap-1 text-sm text-white/45 transition-colors hover:text-white/80"
        >
          <ChevronLeft size={16} />
          Playlists
        </Link>

        {loading ? (
          <div className="h-6 w-40 animate-pulse rounded bg-white/10" />
        ) : (
          <div className="flex items-baseline justify-between gap-3">
            <h1 className="text-lg font-semibold text-white/90">
              {playlist?.name}
            </h1>
            <p className="text-sm text-white/50">
              {videos.length} {videos.length === 1 ? "video" : "videos"}
            </p>
          </div>
        )}
      </div>

      {!loading && videos.length === 0 ? (
        <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-white/10 text-sm text-white/40">
          No videos in this playlist yet
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {loading
            ? Array.from({ length: 12 }).map((_, i) => <CardSkeleton key={i} />)
            : videos.map((video) => (
                <VideoCardItem key={video.id} video={video} />
              ))}
        </div>
      )}
    </div>
  );
}
