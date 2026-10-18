import { Outlet } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import { useAmbient } from "./AmbientContext";

const Layout = () => {
  const { ambientSrc } = useAmbient();

  return (
    <div className="relative flex h-screen overflow-hidden bg-[#0c0c0f]">
      {/* Full-screen poster — center clear, corners/edges dark (streaming style) */}
      {ambientSrc && (
        <div
          className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
          style={{ contain: "strict" }}
        >
          <img
            src={ambientSrc}
            alt=""
            decoding="async"
            className="absolute inset-0 h-full w-full scale-105 object-cover"
          />
          {/* Center stays readable; corners and edges go dark */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_transparent_25%,_rgba(0,0,0,0.45)_55%,_rgba(0,0,0,0.82)_78%,_rgba(0,0,0,0.95)_100%)]" />
          {/* Extra side darkening (sidebar + right edge) */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-transparent to-black/55" />
          {/* Top + bottom fade */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/45" />
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
