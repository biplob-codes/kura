import {
  Archive,
  ChevronLeft,
  ChevronRight,
  FolderCheck,
  Folders,
  FolderSync,
  Home,
  ListVideo,
  Settings,
} from "lucide-react";
import type { ElementType } from "react";
import { NavLink } from "react-router-dom";

interface NavItem {
  label: string;
  to: string;
  icon: ElementType;
}

const navItems: NavItem[] = [
  { label: "Home", to: "/", icon: Home },
  { label: "Folders", to: "/folders", icon: Folders },
  { label: "Watchlist", to: "/watchlist", icon: ListVideo },
  { label: "Watched", to: "/watched", icon: FolderCheck },
  { label: "Archive", to: "/archive", icon: Archive },
  { label: "Transfer", to: "/transfer", icon: FolderSync },
];

const settingsItem: NavItem = {
  label: "Settings",
  to: "/settings",
  icon: Settings,
};

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

function SidebarLink({
  item,
  collapsed,
}: {
  item: NavItem;
  collapsed: boolean;
}) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.to}
      end={item.to === "/"}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        [
          "group relative flex items-center gap-2.5 rounded-md px-2.5 py-1.75 transition-colors duration-100 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-black/4 dark:hover:bg-white/5",
          collapsed ? "justify-center" : "",
          isActive
            ? "bg-black/5 dark:bg-white/10 text-neutral-900 dark:text-neutral-100"
            : "",
        ].join(" ")
      }
    >
      <Icon size={17} strokeWidth={2} className="shrink-0" />
      {!collapsed && <span>{item.label}</span>}
    </NavLink>
  );
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  return (
    <aside
      className={[
        "flex h-screen flex-col justify-between px-2.5 pb-3 pt-3 border-r border-gray-300 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 transition-[width] duration-200 ease-in-out",
        collapsed ? "w-14" : "w-60",
      ].join(" ")}
    >
      <div className="flex flex-col gap-2">
        {/* Toggle button */}
        <button
          type="button"
          onClick={onToggle}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={[
            "flex items-center gap-2.5 rounded-md px-2.5 py-1.75 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-black/4 dark:hover:bg-white/5 transition-colors cursor-pointer",
            collapsed ? "justify-center" : "",
          ].join(" ")}
        >
          {collapsed ? (
            <ChevronRight size={17} strokeWidth={2} className="shrink-0" />
          ) : (
            <>
              <ChevronLeft size={17} strokeWidth={2} className="shrink-0" />
              <span>Collapse</span>
            </>
          )}
        </button>

        <nav className="flex flex-col gap-2">
          {navItems.map((item) => (
            <SidebarLink key={item.label} item={item} collapsed={collapsed} />
          ))}
        </nav>
      </div>

      <div>
        <div className="mb-2 h-px w-full bg-black/10 dark:bg-white/10" />
        <SidebarLink item={settingsItem} collapsed={collapsed} />
      </div>
    </aside>
  );
}
