import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import VideoList from "../components/VideoList";
import VideoMetadata from "../components/VideoMetadata";
import VideoPlayer from "../components/VideoPlayer";

// ── Shared type (mirrors the Rust `Video` struct exactly) ─────────────
// Exported so VideoList and VideoMetadata use the same shape instead of
// each redefining their own subset of it.

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
}

export interface Tag {
  id: string;
  name: string;
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
        setVideos(res.videos);
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
    // Re-run only when the URL's videoId actually changes, not on every
    // local selection within the list (that's handled by setSelectedId
    // alone — no need to refetch the whole sibling list just to switch
    // which one is playing).
  }, [videoId]);

  const selectedVideo = videos.find((v) => v.id === selectedId);

  if (error) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-neutral-50 dark:bg-neutral-950 p-3">
        <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-6 py-4 text-sm text-neutral-500 dark:text-neutral-400">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full items-stretch justify-center bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 p-3">
      <div className="flex h-full w-full max-w-6xl gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <VideoPlayer path={selectedVideo?.file_path ?? ""} />
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
    </div>
  );
};

export default VideoPage;
