import { formatFileSize } from "../utils/files";

interface File {
  name: string;
  path: string;
  size: number;
}
interface Props {
  folderName: string;
  files: File[];
  loading: boolean;
  selectedPath: string;
  setSelectedPath: (path: string) => void;
}
const VideoList = ({
  folderName,
  files,
  loading,
  selectedPath,
  setSelectedPath,
}: Props) => {
  return (
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
          <p className="px-5 py-4 text-sm text-neutral-400">Loading files…</p>
        ) : files.length === 0 ? (
          <p className="px-5 py-4 text-sm text-neutral-400">No files found.</p>
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
                        {file.name}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-neutral-400">
                        {formatFileSize(file.size)}
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
  );
};

export default VideoList;
