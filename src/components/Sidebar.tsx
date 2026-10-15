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
  { label: "Settings", to: "/settings", icon: Settings },
];

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
          "group relative mx-1.5 flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition-colors duration-150",
          collapsed ? "justify-center" : "",
          isActive
            ? "bg-white/15 text-white"
            : "text-white/70 hover:bg-white/8 hover:text-white",
        ].join(" ")
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            size={17}
            strokeWidth={isActive ? 2.25 : 1.75}
            className="shrink-0"
          />
          {!collapsed && (
            <span className="font-medium tracking-[-0.01em]">{item.label}</span>
          )}
        </>
      )}
    </NavLink>
  );
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  return (
    <aside
      className={[
        "relative flex h-screen flex-col",
        "bg-black/40 backdrop-blur-md",
        "transition-[width] duration-200 ease-out",
        collapsed ? "w-[56px]" : "w-[220px]",
      ].join(" ")}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-2 px-3 pt-3 pb-2">
          <button
            type="button"
            onClick={onToggle}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={[
              "flex h-8 w-8 items-center justify-center rounded-lg",
              "text-white/60 hover:bg-white/10 hover:text-white",
              "transition-colors cursor-pointer",
              collapsed ? "mx-auto" : "",
            ].join(" ")}
          >
            {collapsed ? (
              <ChevronRight size={17} strokeWidth={2} />
            ) : (
              <ChevronLeft size={17} strokeWidth={2} />
            )}
          </button>
          {!collapsed && (
            <span className="text-[13px] font-semibold tracking-[-0.02em] text-white/90">
              Kura
            </span>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto pb-3">
          <div className="flex flex-col gap-0.5">
            {navItems.map((item) => (
              <SidebarLink key={item.label} item={item} collapsed={collapsed} />
            ))}
          </div>
        </nav>
      </div>
    </aside>
  );
}
