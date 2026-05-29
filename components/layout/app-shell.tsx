"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Bot,
  Database,
  LayoutDashboard,
  ScrollText,
  Settings,
  ShieldCheck,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Agents", href: "/agents", icon: Bot },
  { label: "Approvals", href: "/approvals", icon: ShieldCheck },
  { label: "Runs", href: "/runs", icon: Activity },
  { label: "Logs", href: "/logs", icon: ScrollText },
  { label: "Data Sources", href: "/data-sources", icon: Database },
  { label: "Settings", href: "/settings", icon: Settings },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }
  return pathname.startsWith(href);
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  if (pathname === "/agents/security") {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <aside
        className={`sticky top-0 h-screen shrink-0 border-r border-slate-800 bg-slate-950 p-5 transition-all duration-300 ${
          collapsed ? "w-20" : "w-72"
        }`}
      >
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="mb-4 flex w-full items-center justify-end text-slate-400 hover:text-white transition"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-5 w-5" />
          ) : (
            <PanelLeftClose className="h-5 w-5" />
          )}
        </button>

        {!collapsed && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm font-medium text-cyan-400">AgentOps360</p>
            <h1 className="mt-2 text-xl font-bold">AI Control Plane</h1>
            <p className="mt-2 text-sm text-slate-400">
              Agents, approvals, logs, cost and governance.
            </p>
          </div>
        )}

        <nav className={`space-y-2 ${!collapsed ? "mt-6" : "mt-2"}`}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActivePath(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                  collapsed ? "justify-center" : ""
                } ${
                  active
                    ? "bg-cyan-400 text-slate-950"
                    : "text-slate-300 hover:bg-slate-900 hover:text-white"
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!collapsed && item.label}
              </Link>
            );
          })}
        </nav>

        {!collapsed && (
          <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-xs text-slate-500">Demo Workspace</p>
            <p className="mt-1 text-sm font-semibold">PakMart E-commerce</p>
          </div>
        )}
      </aside>

      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}