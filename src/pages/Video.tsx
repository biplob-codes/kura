import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import VideoList from "../components/VideoList";
import VideoMetadata from "../components/VideoMetadata";
import VideoPlayer from "../components/VideoPlayer";

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

  const selectedVideo = videos.find((v) => v.id === selectedId);

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center p-4">
        <div className="rounded-[12px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#2c2c2e] px-6 py-4 text-[13px] text-[#86868b]">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full items-stretch p-2.5 gap-2.5 min-h-0">
      <div className="flex min-w-0 flex-1 flex-col min-h-0 overflow-y-auto">
        <div className="flex flex-col gap-2.5 pb-1">
          <div className="w-full shrink-0 overflow-hidden rounded-[12px] border border-black/[0.06] dark:border-white/[0.08] bg-black shadow-sm aspect-video">
            <VideoPlayer path={selectedVideo?.file_path ?? ""} />
          </div>

          <VideoMetadata
            video={selectedVideo}
            onWatchedChange={(id, watched) =>
              setVideos((prev) =>
                prev.map((v) => (v.id === id ? { ...v, watched } : v)),
              )
            }
          />
        </div>
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
