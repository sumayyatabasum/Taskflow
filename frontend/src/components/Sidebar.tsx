"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CheckSquare,
  BookOpen,
  Calendar,
  GraduationCap,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/todo", label: "To-Do", icon: CheckSquare },
  { href: "/syllabus", label: "Syllabus", icon: BookOpen },
  { href: "/schedule", label: "Schedule", icon: Calendar },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 h-screen sticky top-0 flex flex-col border-r border-white/[0.06] bg-[#0a0e17]">
      {/* Logo */}
      <div className="p-5 border-b border-white/[0.06]">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:shadow-indigo-500/50 transition-shadow">
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-white text-sm leading-tight">
              GATE DA
            </p>
            <p className="text-[10px] text-indigo-400 font-medium">
              2027 Tracker
            </p>
          </div>
        </Link>
      </div>

      {/* Nav */}
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

      {/* Countdown badge */}
      <div className="px-3 pb-4">
        <GateCountdownBadge />
      </div>
    </aside>
  );
}

function GateCountdownBadge() {
  const gateDate = new Date("2027-02-01");
  const now = new Date();
  const diff = Math.max(
    0,
    Math.ceil((gateDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
  );

  return (
    <div className="bg-gradient-to-br from-indigo-600/20 to-violet-600/20 border border-indigo-500/20 rounded-xl p-3">
      <p className="text-[10px] font-semibold text-indigo-400 uppercase tracking-widest mb-1">
        GATE DA 2027
      </p>
      <p className="text-2xl font-bold text-white">{diff}</p>
      <p className="text-[11px] text-slate-500">days remaining</p>
    </div>
  );
}
