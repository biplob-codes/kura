import { Outlet } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import { useAmbient } from "./AmbientContext";

const Layout = () => {
  const { ambientSrc } = useAmbient();

  return (
    <div className="relative flex h-screen overflow-hidden bg-[#0c0c0f]">
      {/* Full-screen poster background (covers sidebar + content) */}
      {ambientSrc && (
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <img
            src={ambientSrc}
            alt=""
            className="absolute inset-0 h-full w-full scale-110 object-cover"
          />
          {/* Edges darker → center clearer (streaming-style vignette) */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_transparent_35%,_rgba(0,0,0,0.55)_70%,_rgba(0,0,0,0.85)_100%)]" />
          {/* Extra side fade so sidebar area stays readable */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-transparent to-black/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/30" />
        </div>
      )}

      <div className="relative z-10 flex h-full w-full">
        <Sidebar />
        <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;
