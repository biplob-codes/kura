import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import {
  fileNameFromPath,
  formatFileSize,
  getDirPath,
  getFolderName,
} from "../utils/files";

interface File {
  name: string;
  path: string;
  size: number;
}

function getRandomDuration(): string {
  const totalMinutes = Math.floor(Math.random() * (60 - 20 + 1)) + 20;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

const Video = () => {
  const { videoPath } = useParams();
  const initialPath = videoPath ? decodeURIComponent(videoPath) : "";
  const dirPath = getDirPath(initialPath);
  const folderName = getFolderName(dirPath);

  const [files, setFiles] = useState<File[]>([]);
  const [selectedPath, setSelectedPath] = useState<string>(initialPath);
  const [loading, setLoading] = useState(true);
  const [durations] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    invoke<File[]>("list_files", { path: dirPath })
      .then((res) => setFiles(res))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedFile = files.find((f) => f.path === selectedPath);

  const getDuration = (path: string): string => {
    if (!durations.has(path)) {
      durations.set(path, getRandomDuration());
    }
    return durations.get(path)!;
  };

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
                <source src={selectedPath} type="video/mp4" />
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
          <div className="shrink-0 rounded-lg border border-neutral-200 bg-white px-6 py-4">
            {selectedFile ? (
              <>
                <h1 className="truncate text-base font-semibold text-neutral-900">
                  {selectedFile.name || fileNameFromPath(selectedFile.path)}
                </h1>
                <p className="mt-1 text-sm text-neutral-400">
                  {formatFileSize(selectedFile.size)} &middot;{" "}
                  {getDuration(selectedFile.path)}
                </p>
              </>
            ) : (
              <>
                <h1 className="text-base font-semibold text-neutral-300">
                  No video selected
                </h1>
                <p className="mt-1 text-sm text-neutral-300">— &middot; —</p>
              </>
            )}
          </div>
        </div>

        {/* Right: file list - its own bordered box */}
        <div className="flex w-72 shrink-0 flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white">
          <div className="shrink-0 border-b border-neutral-200 px-5 py-4">
            <h2 className="truncate text-sm font-semibold text-neutral-900">
              {folderName || "Files"}
            </h2>
            <p className="mt-0.5 text-xs text-neutral-400">
              {files.length} {files.length === 1 ? "video" : "videos"}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <p className="px-5 py-4 text-sm text-neutral-400">
                Loading files…
              </p>
            ) : files.length === 0 ? (
              <p className="px-5 py-4 text-sm text-neutral-400">
                No files found.
              </p>
            ) : (
              <ul>
                {files.map((file) => {
                  const isSelected = file.path === selectedPath;
                  return (
                    <li key={file.path}>
                      <button
                        type="button"
                        onClick={() => setSelectedPath(file.path)}
                        className={`flex w-full items-center gap-3 px-5 py-3 text-left cursor-pointer transition-colors ${
                          isSelected ? "bg-neutral-100" : "hover:bg-neutral-50"
                        }`}
                      >
                        <span
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                            isSelected
                              ? "bg-neutral-900 text-white"
                              : "bg-neutral-100 text-neutral-400"
                          }`}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="h-3.5 w-3.5"
                          >
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </span>
                        <span className="min-w-0 flex-1">
                          <p
                            className={`truncate text-sm ${
                              isSelected
                                ? "font-medium text-neutral-900"
                                : "text-neutral-700"
                            }`}
                          >
                            {file.name || fileNameFromPath(file.path)}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-neutral-400">
                            {formatFileSize(file.size)} &middot;{" "}
                            {getDuration(file.path)}
                          </p>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Video;
