"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, Menu } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export type TopbarUserProps = {
  displayName: string;
  email: string;
  roleKey: string | null | undefined;
  initials: string;
};

type TopbarClientProps = {
  user: TopbarUserProps;
  onOpenMobileNav: () => void;
};

function avatarClassForRole(role?: string | null): string {
  const normalized = (role ?? "").toUpperCase();
  if (normalized.includes("SUPER")) return "bg-purple-600";
  if (normalized.includes("ADMIN")) return "bg-blue-600";
  if (normalized.includes("OFFICER")) return "bg-emerald-600";
  if (normalized.includes("INTAKE")) return "bg-amber-500";
  return "bg-neutral-900";
}

export default function TopbarClient({ user, onOpenMobileNav }: TopbarClientProps) {
  const { displayName, email, roleKey, initials } = user;
  const avatarClassName = avatarClassForRole(roleKey);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 w-full min-w-0 border-b border-neutral-200 bg-white/95 backdrop-blur">
      <div className="flex h-16 min-w-0 items-center justify-between gap-2 px-3 sm:px-4 lg:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onOpenMobileNav}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-neutral-200 text-neutral-800 transition hover:bg-neutral-50 lg:hidden"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold text-neutral-900">HR Management System</h1>
            <p className="hidden text-sm text-neutral-500 sm:block">Dashboard workspace</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
          <Link
            href="/alerts/active"
            className="inline-flex min-w-0 items-center justify-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-2 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 sm:px-3"
            aria-label="View notifications"
          >
            <Bell className="h-4 w-4 shrink-0" aria-hidden />
            <span className="hidden sm:inline">Notifications</span>
          </Link>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((value) => !value)}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-xl border border-neutral-200 bg-white py-1.5 pl-1.5 pr-2",
                "hover:bg-neutral-50 sm:pl-2 sm:pr-3",
              )}
            >
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white",
                  avatarClassName,
                )}
              >
                {initials}
              </div>
              <div className="hidden min-w-0 text-left md:block">
                <p className="truncate text-sm font-medium text-neutral-900">{displayName}</p>
                <p className="truncate text-xs text-neutral-500">{email}</p>
              </div>
            </button>

            <div
              className={cn(
                "absolute right-0 z-20 mt-2 w-56 rounded-2xl border border-neutral-200 bg-white p-2 shadow-lg",
                menuOpen ? "block" : "hidden",
              )}
              role="menu"
              aria-label="User menu"
            >
              <p className="block px-3 py-1 text-xs text-neutral-500 md:hidden">{displayName}</p>
              <Link
                href="/profile/change-password"
                onClick={() => setMenuOpen(false)}
                className="block rounded-xl px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                role="menuitem"
              >
                Change Password
              </Link>
              <Link
                href="/logout"
                onClick={() => setMenuOpen(false)}
                className="block rounded-xl px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                role="menuitem"
              >
                Logout
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
