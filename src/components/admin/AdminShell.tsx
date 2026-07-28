import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  Activity,
  BadgeDollarSign,
  FileSearch,
  Headphones,
  LayoutDashboard,
  LogOut,
  Menu,
  Scale,
  ShieldCheck,
  Users,
} from "lucide-react";
import { NexaLogo } from "@/components/NexaLogo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/format";

const ADMIN_NAV = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/admin/kyc", label: "KYC Review", icon: ShieldCheck },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/disputes", label: "Disputes", icon: Scale },
  { to: "/admin/support", label: "Support", icon: Headphones },
  { to: "/admin/audit", label: "Audit Log", icon: Activity },
  { to: "/admin/deposits", label: "Deposits", icon: BadgeDollarSign },
] as const;

function AdminNavigation({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="space-y-1">
      {ADMIN_NAV.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={"end" in item ? item.end : false}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              "nav-item w-full",
              isActive ? "bg-accent font-semibold text-foreground" : "hover:text-foreground",
            )
          }
        >
          <item.icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.8} aria-hidden="true" />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}

export function AdminShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { profile, logout } = useAdminAuth();
  const location = useLocation();

  useEffect(() => setMobileOpen(false), [location.pathname]);

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[236px] flex-col border-r border-border bg-card md:flex">
        <div className="flex h-16 items-center justify-between border-b border-border px-5">
          <NexaLogo size="md" />
          <span className="rounded-md border border-border px-2 py-1 text-[10px] font-semibold uppercase text-muted-foreground">
            Admin
          </span>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4">
          <AdminNavigation />
        </div>

        <div className="border-t border-border p-3">
          <div className="flex items-center gap-2.5 rounded-lg border border-border bg-background p-2.5">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary-muted text-[11px] font-semibold text-primary">
              {initials(profile.fullName || profile.username)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-medium">{profile.fullName || profile.username}</span>
              <span className="block truncate text-[11px] text-muted-foreground">@{profile.username}</span>
            </span>
            <ThemeToggle className="h-7 w-7" />
          </div>
          <button type="button" onClick={logout} className="nav-item mt-2 w-full">
            <LogOut className="h-[18px] w-[18px]" aria-hidden="true" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="min-w-0 md:pl-[236px]">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur-xl md:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="Open admin navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <FileSearch className="h-4 w-4 text-primary" aria-hidden="true" />
            <span className="text-sm font-semibold">Nexa Admin</span>
          </div>
          <ThemeToggle />
        </header>

        <main className="px-4 py-6 sm:px-6 md:px-8 md:py-8 xl:px-10">
          <div className="mx-auto w-full max-w-[1280px]">
            <Outlet />
          </div>
        </main>
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[280px] p-0">
          <div className="flex h-16 items-center border-b border-border px-5">
            <NexaLogo size="md" />
          </div>
          <div className="px-3 py-4">
            <AdminNavigation onNavigate={() => setMobileOpen(false)} />
          </div>
          <div className="absolute inset-x-0 bottom-0 border-t border-border p-3">
            <p className="truncate px-3 text-sm font-medium">{profile.fullName || profile.username}</p>
            <p className="truncate px-3 text-xs text-muted-foreground">{profile.email}</p>
            <button type="button" onClick={logout} className="nav-item mt-2 w-full">
              <LogOut className="h-[18px] w-[18px]" aria-hidden="true" />
              Sign out
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
