import { fileNameFromPath, formatFileSize } from "../utils/files";

interface File {
  name: string;
  path: string;
  size: number;
}
interface Props {
  file?: File;
}
const VideoMetadata = ({ file }: Props) => {
  return (
    <div className="shrink-0 rounded-lg border border-neutral-200 bg-white px-6 py-4">
      {file ? (
        <>
          <h1 className="truncate text-base font-semibold text-neutral-900">
            {file.name || fileNameFromPath(file.path)}
          </h1>
          <p className="mt-1 text-sm text-neutral-400">
            {formatFileSize(file.size)} &middot;
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
  );
};

export default VideoMetadata;
