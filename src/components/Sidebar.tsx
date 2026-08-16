import { Folders, FolderSync, Home, Settings } from "lucide-react";
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
  { label: "Transfer", to: "/transfer", icon: FolderSync },
];

const settingsItem: NavItem = {
  label: "Settings",
  to: "/settings",
  icon: Settings,
};

function SidebarLink({ item }: { item: NavItem }) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.to}
      end={item.to === "/"}
      className={({ isActive }) =>
        [
          "group flex items-center gap-2.5 rounded-md px-2.5 py-1.75 transition-colors duration-100 text-sm hover:bg-black/4",
          isActive ? "bg-black/5" : "",
        ].join(" ")
      }
    >
      <Icon size={17} strokeWidth={2} />
      <span>{item.label}</span>
    </NavLink>
  );
}

export default function Sidebar() {
  return (
    <aside className="flex h-screen w-60 flex-col justify-between px-2.5 pb-3 pt-3 border-r border-gray-300">
      <nav className="flex flex-col gap-2">
        {navItems.map((item) => (
          <SidebarLink key={item.label} item={item} />
        ))}
      </nav>

      <div>
        <div className="mb-2 h-px w-full bg-black/10" />
        <SidebarLink item={settingsItem} />
      </div>
    </aside>
  );
}
