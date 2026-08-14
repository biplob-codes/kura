interface Props {
  path: string;
}
const VIDEO_SERVER_URL = "http://127.0.0.1:8000/video";

function buildStreamUrl(path: string): string {
  return `${VIDEO_SERVER_URL}?path=${encodeURIComponent(path)}`;
}
const VideoPlayer = ({ path }: Props) => {
  return (
    <div className="flex flex-1 items-center justify-center overflow-hidden rounded-lg border border-neutral-200 bg-neutral-950">
      {path ? (
        <video
          key={path}
          controls
          autoPlay
          className="h-full w-full bg-black object-contain"
        >
          <source src={buildStreamUrl(path)} type="video/mp4" />
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
  );
};

export default VideoPlayer;
