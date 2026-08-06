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
