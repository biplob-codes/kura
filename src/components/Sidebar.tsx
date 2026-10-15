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

const favorites: NavItem[] = [
  { label: "Home", to: "/", icon: Home },
  { label: "Folders", to: "/folders", icon: Folders },
  { label: "Watchlist", to: "/watchlist", icon: ListVideo },
];

const library: NavItem[] = [
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

function SectionLabel({
  children,
  collapsed,
}: {
  children: string;
  collapsed: boolean;
}) {
  if (collapsed) return <div className="h-2" />;
  return (
    <p className="px-3 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-[#86868b] dark:text-[#98989d]">
      {children}
    </p>
  );
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
          "group relative mx-1.5 flex items-center gap-2.5 rounded-[7px] px-2.5 py-[6px] text-[13px] transition-colors duration-100",
          collapsed ? "justify-center" : "",
          isActive
            ? "bg-[#007AFF] text-white shadow-sm"
            : "text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-black/[0.06] dark:hover:bg-white/[0.08]",
        ].join(" ")
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            size={16}
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
        "flex h-screen flex-col border-r border-black/[0.08] dark:border-white/[0.08]",
        "bg-[#f6f6f6]/80 dark:bg-[#2c2c2e]/90 backdrop-blur-xl",
        "text-[#1d1d1f] dark:text-[#f5f5f7]",
        "transition-[width] duration-200 ease-out",
        collapsed ? "w-[56px]" : "w-[220px]",
      ].join(" ")}
    >
      <div className="flex items-center gap-2 px-3 pt-3 pb-1">
        <button
          type="button"
          onClick={onToggle}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={[
            "flex h-7 w-7 items-center justify-center rounded-md",
            "text-[#86868b] hover:bg-black/[0.06] dark:hover:bg-white/[0.08]",
            "transition-colors cursor-pointer",
            collapsed ? "mx-auto" : "",
          ].join(" ")}
        >
          {collapsed ? (
            <ChevronRight size={16} strokeWidth={2} />
          ) : (
            <ChevronLeft size={16} strokeWidth={2} />
          )}
        </button>
        {!collapsed && (
          <span className="text-[13px] font-semibold tracking-[-0.02em] text-[#1d1d1f] dark:text-[#f5f5f7]">
            Kura
          </span>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto pb-2">
        <SectionLabel collapsed={collapsed}>Favorites</SectionLabel>
        <div className="flex flex-col gap-0.5">
          {favorites.map((item) => (
            <SidebarLink key={item.label} item={item} collapsed={collapsed} />
          ))}
        </div>

        <SectionLabel collapsed={collapsed}>Library</SectionLabel>
        <div className="flex flex-col gap-0.5">
          {library.map((item) => (
            <SidebarLink key={item.label} item={item} collapsed={collapsed} />
          ))}
        </div>
      </nav>

      <div className="border-t border-black/[0.06] dark:border-white/[0.08] py-2">
        <SidebarLink item={settingsItem} collapsed={collapsed} />
      </div>
    </aside>
  );
}
