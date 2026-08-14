import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import VideoList from "../components/VideoList";
import VideoMetadata from "../components/VideoMetadata";
import { getDirPath, getFolderName } from "../utils/files";
import VideoPlayer from "../components/VideoPlayer";

interface File {
  name: string;
  path: string;
  size: number;
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
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <VideoPlayer path={selectedPath} />
          <VideoMetadata file={selectedFile} />
        </div>
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
