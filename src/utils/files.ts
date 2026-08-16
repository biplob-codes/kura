/**
 * Converts a file size in bytes into a human-readable string
 * (e.g. "1.50 KB", "23.40 MB", "1.20 GB").
 */
export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) {
    throw new Error("bytes must be a non-negative finite number");
  }

  const units = ["B", "KB", "MB", "GB", "TB", "PB"] as const;

  if (bytes === 0) return "0.00 B";

  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );

  const value = bytes / 1024 ** exponent;

  return `${value.toFixed(2)} ${units[exponent]}`;
}

export function getDirPath(videoPath: string): string {
  const lastSlashIndex = Math.max(
    videoPath.lastIndexOf("/"),
    videoPath.lastIndexOf("\\"),
  );
  return lastSlashIndex === -1 ? "" : videoPath.slice(0, lastSlashIndex);
}

export function getFolderName(dirPath: string): string {
  const lastSlashIndex = Math.max(
    dirPath.lastIndexOf("/"),
    dirPath.lastIndexOf("\\"),
  );
  return lastSlashIndex === -1 ? dirPath : dirPath.slice(lastSlashIndex + 1);
}
export function fileNameFromPath(path: string): string {
  const parts = path.split(/[\\/]/);
  return parts[parts.length - 1] || path;
}
export function formatDuration(seconds: number | null): string {
  if (seconds == null) return "--:--";
  const total = Math.round(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}
