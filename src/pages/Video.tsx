import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import VideoList from "../components/VideoList";
import VideoMetadata from "../components/VideoMetadata";
import { getDirPath, getFolderName } from "../utils/files";

interface File {
  name: string;
  path: string;
  size: number;
}

const VIDEO_SERVER_URL = "http://127.0.0.1:8000/video";

function buildStreamUrl(path: string): string {
  return `${VIDEO_SERVER_URL}?path=${encodeURIComponent(path)}`;
}

const Video = () => {
  const { videoPath } = useParams();
  const initialPath = videoPath ? decodeURIComponent(videoPath) : "";
  const dirPath = getDirPath(initialPath);
  const folderName = getFolderName(dirPath);

  const [files, setFiles] = useState<File[]>([]);
  const [selectedPath, setSelectedPath] = useState<string>(initialPath);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    invoke<File[]>("list_files", { path: dirPath })
      .then((res) => setFiles(res))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedFile = files.find((f) => f.path === selectedPath);

  return (
    <div className="flex h-screen w-full items-stretch justify-center bg-neutral-50 text-neutral-900 p-3">
      <div className="flex h-full w-full max-w-6xl gap-4">
        {/* Left column: player + metadata, each its own box */}
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          {/* Player - its own bordered box, always full size */}
          <div className="flex flex-1 items-center justify-center overflow-hidden rounded-lg border border-neutral-200 bg-neutral-950">
            {selectedPath ? (
              <video
                key={selectedPath}
                controls
                autoPlay
                className="h-full w-full bg-black object-contain"
              >
                <source src={buildStreamUrl(selectedPath)} type="video/mp4" />
              </video>
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-neutral-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.25}
                  className="h-14 w-14"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 10.5l4.72-2.72a.75.75 0 011.13.65v8.14a.75.75 0 01-1.13.65l-4.72-2.72M4.5 6.75h9a1.5 1.5 0 011.5 1.5v7.5a1.5 1.5 0 01-1.5 1.5h-9a1.5 1.5 0 01-1.5-1.5v-7.5a1.5 1.5 0 011.5-1.5z"
                  />
                </svg>
                <p className="text-sm text-neutral-400">No video selected</p>
              </div>
            )}
          </div>

          {/* Metadata - its own bordered box */}
          <VideoMetadata file={selectedFile} />
        </div>

        {/* Right: file list - its own bordered box */}
        <VideoList
          files={files}
          folderName={folderName}
          loading={loading}
          selectedPath={selectedPath}
          setSelectedPath={(p) => setSelectedPath(p)}
        />
      </div>
    </div>
  );
};

export default Video;
