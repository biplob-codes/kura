import {
  Archive,
  FolderCheck,
  Folders,
  FolderSync,
  Home,
  ListVideo,
  Settings,
  Users,
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
  { label: "Models", to: "/models", icon: Users },
  { label: "Watchlist", to: "/watchlist", icon: ListVideo },
  { label: "Watched", to: "/watched", icon: FolderCheck },
  { label: "Archive", to: "/archive", icon: Archive },
  { label: "Transfer", to: "/transfer", icon: FolderSync },
  { label: "Settings", to: "/settings", icon: Settings },
];

function SidebarLink({ item }: { item: NavItem }) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.to}
      end={item.to === "/"}
      className={({ isActive }) =>
        [
          "group relative mx-1.5 flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition-colors duration-150",
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
          <span className="font-medium tracking-[-0.01em]">{item.label}</span>
        </>
      )}
    </NavLink>
  );
}

export default function Sidebar() {
  return (
    <aside className="relative flex h-screen w-[220px] flex-col bg-black/40 backdrop-blur-md">
      <nav className="flex-1 overflow-y-auto px-0 pt-4 pb-3">
        <div className="flex flex-col gap-0.5">
          {navItems.map((item) => (
            <SidebarLink key={item.label} item={item} />
          ))}
        </div>
      </nav>
    </aside>
  );
}
