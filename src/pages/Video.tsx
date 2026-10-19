import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import VideoList from "../components/VideoList";
import VideoMetadata from "../components/VideoMetadata";

export interface Tag {
  id: string;
  name: string;
}

export interface Model {
  id: string;
  name: string;
}

export interface Video {
  id: string;
  folder_id: string;
  title: string;
  file_path: string;
  thumbnail_path: string | null;
  duration_seconds: number | null;
  width: number | null;
  height: number | null;
  size_bytes: number;
  watched: boolean;
  tags: Tag[];
  models: Model[];
}

interface FolderSiblingsResponse {
  folder_name: string;
  videos: Video[];
}

const VideoPage = () => {
  const { videoId } = useParams<{ videoId: string }>();

  const [folderName, setFolderName] = useState("");
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedId, setSelectedId] = useState<string>(videoId ?? "");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playError, setPlayError] = useState<string | null>(null);

  useEffect(() => {
    if (!videoId) {
      setError("No video specified.");
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    invoke<FolderSiblingsResponse>("get_folder_siblings", { videoId })
      .then((res) => {
        if (cancelled) return;
        setFolderName(res.folder_name);
        setVideos(
          res.videos.map((v) => ({
            ...v,
            tags: v.tags ?? [],
            models: v.models ?? [],
          })),
        );
        setSelectedId(videoId);
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
  }, [videoId]);

  // Open in Celluloid when route id or side-list selection changes
  useEffect(() => {
    if (!selectedId || loading) return;
    let cancelled = false;
    setPlayError(null);
    invoke("play_video", { videoId: selectedId }).catch((err) => {
      if (!cancelled) setPlayError(String(err));
    });
    return () => {
      cancelled = true;
    };
  }, [selectedId, loading]);

  const selectedVideo = videos.find((v) => v.id === selectedId);

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center p-6">
        <p className="text-sm text-white/50">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full min-h-0 gap-3 pt-3 pr-3">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
        {playError && (
          <div className="mb-3 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {playError}
          </div>
        )}
        <VideoMetadata
          video={selectedVideo}
          onWatchedChange={(id, watched) =>
            setVideos((prev) =>
              prev.map((v) => (v.id === id ? { ...v, watched } : v)),
            )
          }
        />
      </div>

      <VideoList
        folderName={folderName}
        videos={videos}
        loading={loading}
        selectedId={selectedId}
        setSelectedId={setSelectedId}
      />
    </div>
  );
};

export default VideoPage;
