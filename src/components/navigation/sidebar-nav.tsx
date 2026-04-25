"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  BarChart2,
  Bell,
  Calendar,
  DollarSign,
  FileStack,
  FileText,
  FolderOpen,
  Landmark,
  LayoutDashboard,
  ListTree,
  Settings2,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { APP_VERSION } from "@/lib/app-version";
import type { DashboardNavIconName, SerializedNavItem } from "@/lib/navigation/dashboard-nav";
import { cn } from "@/lib/utils/cn";

const ICON_MAP: Record<DashboardNavIconName, LucideIcon> = {
  layoutDashboard: LayoutDashboard,
  users: Users,
  fileText: FileText,
  calendar: Calendar,
  folderOpen: FolderOpen,
  fileStack: FileStack,
  dollarSign: DollarSign,
  landmark: Landmark,
  bell: Bell,
  barChart2: BarChart2,
  listTree: ListTree,
  settings2: Settings2,
};

function NavIcon({ name, className }: { name: DashboardNavIconName; className?: string }) {
  const I = ICON_MAP[name];
  return <I className={className} aria-hidden />;
}

type NavContentVariant = "expanded" | "collapsed" | "drawer";

type DashboardNavContentProps = {
  items: SerializedNavItem[];
  variant: NavContentVariant;
  onNavLinkClick?: () => void;
  currentYear: number;
  brandHeaderEnd?: ReactNode;
  onDrawerClose?: () => void;
};

/**
 * Permission-filtered links are supplied by the server; this component is presentation-only.
 */
export function DashboardNavContent({
  items,
  variant,
  onNavLinkClick,
  currentYear,
  brandHeaderEnd,
  onDrawerClose,
}: DashboardNavContentProps) {
  const isCollapsed = variant === "collapsed";
  const isDrawer = variant === "drawer";
  const renderableItems = isCollapsed
    ? items.flatMap((item) => (item.children?.length ? item.children : [item]))
    : items;

  return (
    <>
      {isDrawer && onDrawerClose ? (
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-neutral-200 px-4 py-3">
          <div className="min-w-0">
            <p className="text-base font-semibold text-neutral-900">HR System</p>
            <p className="text-sm text-neutral-500">Main navigation</p>
          </div>
          <button
            type="button"
            onClick={onDrawerClose}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-neutral-200 text-neutral-600 transition hover:bg-neutral-100"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      ) : null}
      {isDrawer ? null : (
        <div
          className={cn(
            "shrink-0 border-b border-neutral-200",
            isCollapsed ? "p-2" : "px-6 py-5",
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <div className={cn("min-w-0", isCollapsed && "w-full")}>
              <div
                className={cn(
                  "text-lg font-semibold tracking-tight text-neutral-900",
                  isCollapsed && "text-center text-xs font-bold",
                )}
              >
                {isCollapsed ? "HR" : "HR System"}
              </div>
              {!isCollapsed ? (
                <p className="mt-1 text-sm text-neutral-500">Internal management portal</p>
              ) : null}
            </div>
            {brandHeaderEnd ? <div className="shrink-0 pt-0.5">{brandHeaderEnd}</div> : null}
          </div>
        </div>
      )}

      <nav
        className={cn("min-h-0 flex-1 space-y-1 overflow-y-auto p-4", isDrawer && "touch-pan-y")}
        aria-label="Main navigation"
      >
        {renderableItems.map((item) => {
          const itemKey = item.href ?? `group:${item.label}`;
          const linkClass = cn(
            "flex items-center gap-3 rounded-xl text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 hover:text-neutral-900",
            isCollapsed
              ? "min-h-11 min-w-0 flex-col justify-center gap-0.5 px-1.5 py-1.5"
              : "px-3 py-2",
            isDrawer && "min-h-11",
          );
          if (item.children?.length && !isCollapsed) {
            return (
              <div key={itemKey} className="space-y-1 rounded-xl border border-neutral-200 bg-neutral-50 p-2">
                <div className="flex items-center gap-2 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-neutral-600">
                  <NavIcon name={item.icon} className="h-4 w-4 shrink-0 text-neutral-500" />
                  <span>{item.label}</span>
                </div>
                <div className="space-y-1 pl-2">
                  {item.children.map((child) => (
                    <Link
                      key={child.href ?? `${itemKey}:${child.label}`}
                      href={child.href ?? "#"}
                      onClick={onNavLinkClick}
                      className="flex min-h-10 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-neutral-700 transition hover:bg-white hover:text-neutral-900"
                    >
                      <NavIcon name={child.icon} className="h-4 w-4 shrink-0 text-neutral-500" />
                      <span className="min-w-0">{child.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            );
          }

          if (isCollapsed) {
            return (
              <Link
                key={itemKey}
                href={item.href ?? "#"}
                onClick={onNavLinkClick}
                title={item.label}
                className={linkClass}
              >
                <NavIcon name={item.icon} className="h-5 w-5 shrink-0" />
                <span
                  className="max-w-full truncate text-center text-[0.6rem] font-semibold leading-tight text-neutral-600"
                  aria-hidden
                >
                  {item.shortLabel}
                </span>
                <span className="sr-only">{item.label}</span>
              </Link>
            );
          }
          return (
            <Link
              key={itemKey}
              href={item.href ?? "#"}
              onClick={onNavLinkClick}
              className={linkClass}
            >
              <NavIcon name={item.icon} className="h-4 w-4 shrink-0 text-neutral-500" />
              <span className="min-w-0">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className={cn("shrink-0 border-t border-neutral-200 p-4", isCollapsed && "px-2 py-3")}>
        <div className="rounded-2xl bg-neutral-50 p-4">
          {isCollapsed ? (
            <>
              <p className="text-center text-[0.6rem] font-semibold text-neutral-700">D3</p>
              <p className="mt-1 text-center text-xs tracking-normal text-neutral-500" aria-label={`Version ${APP_VERSION}`}>
                {APP_VERSION}
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-neutral-900">D3 Services {currentYear}</p>
              <p className="mt-1 text-xs tracking-normal text-neutral-500">Version {APP_VERSION}</p>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export const SIDEBAR_STORAGE_KEY = "hr-sidebar-collapsed";

type DesktopDashboardSidebarProps = {
  items: SerializedNavItem[];
  collapsed: boolean;
  onToggleCollapse: () => void;
  currentYear: number;
};

export function DesktopDashboardSidebar({
  items,
  collapsed,
  onToggleCollapse,
  currentYear,
}: DesktopDashboardSidebarProps) {
  const collapseButton = (
    <button
      type="button"
      onClick={onToggleCollapse}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 text-neutral-600 transition hover:bg-neutral-50"
      title={collapsed ? "Expand navigation" : "Collapse navigation"}
      aria-expanded={!collapsed}
      aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
    >
      <span className="text-lg font-medium leading-none">{collapsed ? "»" : "«"}</span>
    </button>
  );

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col">
      <div className="flex min-h-0 flex-1 flex-col">
        <DashboardNavContent
          items={items}
          variant={collapsed ? "collapsed" : "expanded"}
          currentYear={currentYear}
          brandHeaderEnd={collapseButton}
        />
      </div>
    </div>
  );
}
