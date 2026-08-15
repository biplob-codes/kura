import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";

const ThumbnailSettings = () => {
  const [enabled, setEnabled] = useState(true);
  const [percent, setPercent] = useState(50);

  const syncSettings = async (nextEnabled: boolean, nextPercent: number) => {
    try {
      await invoke("set_thumbnail_capture_settings", {
        enabled: nextEnabled,
        percent: nextPercent,
      });
    } catch (err) {
      console.error("Failed to update thumbnail settings:", err);
    }
  };

  const handleToggle = () => {
    const next = !enabled;
    setEnabled(next);
    syncSettings(next, percent);
  };

  const handlePercentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;

    // allow empty field while typing
    if (raw === "") {
      setPercent(0);
      return;
    }

    const value = Number(raw);
    if (Number.isNaN(value)) return;

    const clamped = Math.min(100, Math.max(1, value));
    setPercent(clamped);
  };

  const handlePercentBlur = () => {
    const safeValue = percent < 1 ? 1 : percent;
    setPercent(safeValue);
    syncSettings(enabled, safeValue);
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-5 mt-5">
      <h1 className="text-base font-semibold text-gray-900">
        Thumbnail generation
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        Choose whether kura should generate thumbnails during transfer, and at
        what point in the video the thumbnail should be captured.
      </p>

      <div className="mt-5 rounded-lg border border-gray-200 bg-white overflow-hidden">
        {/* Toggle row */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100">
          <div>
            <p className="text-sm font-medium text-gray-900">
              Generate thumbnails during transfer
            </p>
            <p className="text-sm text-gray-500">
              Automatically create a thumbnail when a video is transferred
            </p>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            onClick={handleToggle}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
              enabled ? "bg-blue-500" : "bg-gray-200"
            }`}
          >
            <span
              className={`inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out ${
                enabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {/* Capture point row */}
        <div className="flex items-center justify-between px-4 py-3.5">
          <div>
            <p className="text-sm font-medium text-gray-900">Capture point</p>
            <p className="text-sm text-gray-500">
              How far into the video kura should take the thumbnail
            </p>
          </div>

          <div className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5">
            <input
              type="number"
              min={1}
              max={100}
              value={percent === 0 ? "" : percent}
              onChange={handlePercentChange}
              onBlur={handlePercentBlur}
              disabled={!enabled}
              className="w-10 bg-transparent text-sm text-gray-900 text-right outline-none disabled:text-gray-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="text-sm text-gray-500">%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThumbnailSettings;
