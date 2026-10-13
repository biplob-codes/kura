import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./components/Sidebar";

export type LayoutContext = {
  collapsed: boolean;
};

const Layout = () => {
  // Default collapsed as requested
  const [collapsed, setCollapsed] = useState(true);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-neutral-900">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <div className="flex-1 min-w-0 overflow-y-auto bg-slate-200 dark:bg-neutral-950">
        <Outlet context={{ collapsed } satisfies LayoutContext} />
      </div>
    </div>
  );
};

export default Layout;
