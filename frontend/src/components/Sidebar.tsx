"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  CheckSquare,
  LayoutDashboard,
  FolderKanban,
  LogOut,
  Zap,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderKanban },
];

function Avatar({
  name,
  color,
  size = "md",
}: {
  name: string;
  color?: string;
  size?: "sm" | "md";
}) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const sizeClass = size === "sm" ? "w-7 h-7 text-xs" : "w-9 h-9 text-sm";
  return (
    <div
      className={`${sizeClass} rounded-full flex items-center justify-center font-bold text-white shrink-0 ring-2 ring-white/10`}
      style={{ backgroundColor: color || "#6366f1" }}
    >
      {initials}
    </div>
  );
}

export { Avatar };

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="w-56 shrink-0 h-screen sticky top-0 flex flex-col border-r border-white/[0.06] bg-[#0a0e17]">
      <div className="p-5 border-b border-white/[0.06]">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:shadow-indigo-500/50 transition-shadow">
            <CheckSquare className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white text-lg tracking-tight">
            TaskFlow
          </span>
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-1 pt-4">
        <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-3 mb-2">
          Menu
        </p>
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/20 shadow-sm"
                  : "text-slate-500 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <Icon
                className={`w-4 h-4 ${isActive ? "text-indigo-400" : ""}`}
              />
              {label}
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-3">
        <div className="bg-gradient-to-br from-indigo-600/20 to-violet-600/20 border border-indigo-500/20 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-xs font-semibold text-indigo-300">
              TaskFlow
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            Full-stack task manager with real-time collaboration
          </p>
        </div>
      </div>

      <div className="p-3 border-t border-white/[0.06]">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/5 transition-colors group">
          {user && (
            <Avatar
              name={user.name}
              color={user.avatarColor || user.avatar_color}
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {user?.name}
            </p>
            <p className="text-xs text-slate-600 truncate">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            className="text-slate-600 hover:text-red-400 transition-colors p-1 rounded-lg opacity-0 group-hover:opacity-100"
            title="Logout"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
