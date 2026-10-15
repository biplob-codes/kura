import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./components/Sidebar";

export type LayoutContext = {
  collapsed: boolean;
};

const Layout = () => {
  const [collapsed, setCollapsed] = useState(true);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-neutral-900">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      {/* IMPORTANT: h-full + overflow-hidden so the carousel can take full height */}
      <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden bg-neutral-950">
        <Outlet context={{ collapsed } satisfies LayoutContext} />
      </div>
    </div>
  );
};

export default Layout;
