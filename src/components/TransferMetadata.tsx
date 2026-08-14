import { File } from "../pages/Transfer";
import { formatFileSize } from "../utils/files";

interface Props {
  file: File;
  currentIndex: number;
  numberOfFiles: number;
  onSkip: () => void;
  hasNext: boolean;
  isMoving: boolean;
  loading: boolean;
}
const TransferMetadata = ({
  file,
  currentIndex,
  numberOfFiles,
  hasNext,
  isMoving,
  loading,
  onSkip,
}: Props) => {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      {file ? (
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-neutral-800">
              {file.name}
            </p>
            <p className="mt-1 text-xs text-neutral-400">
              {formatFileSize(file.size)} · {currentIndex + 1} of{" "}
              {numberOfFiles}
            </p>
          </div>

          <button
            type="button"
            onClick={onSkip}
            disabled={!hasNext || isMoving}
            className="shrink-0 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
          >
            Skip
          </button>
        </div>
      ) : (
        <p className="text-sm text-neutral-400">
          {loading ? "Loading metadata…" : "Nothing to show"}
        </p>
      )}
    </div>
  );
};

export default TransferMetadata;
