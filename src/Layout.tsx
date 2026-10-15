import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import { useAmbient } from "./AmbientContext";

export type LayoutContext = {
  collapsed: boolean;
};

const Layout = () => {
  const [collapsed, setCollapsed] = useState(true);
  const { ambientSrc } = useAmbient();

  return (
    <div className="relative flex h-screen overflow-hidden bg-[#0c0c0f]">
      {/* Soft ambient color from the current image – low opacity, behind everything */}
      {ambientSrc && (
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <img
            src={ambientSrc}
            alt=""
            className="absolute inset-0 h-full w-full scale-125 object-cover blur-[100px] opacity-40"
          />
          <div className="absolute inset-0 bg-black/50" />
        </div>
      )}

      <div className="relative z-10 flex h-full w-full">
        <Sidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed((c) => !c)}
        />
        <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
          <Outlet context={{ collapsed } satisfies LayoutContext} />
        </div>
      </div>
    </div>
  );
};

export default Layout;
