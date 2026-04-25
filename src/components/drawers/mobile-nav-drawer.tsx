"use client";

import { useEffect } from "react";
import type { SerializedNavItem } from "@/lib/navigation/dashboard-nav";
import { DashboardNavContent } from "@/components/navigation/sidebar-nav";

type MobileNavDrawerProps = {
  open: boolean;
  onClose: () => void;
  items: SerializedNavItem[];
  currentYear: number;
};

/**
 * Slide-out navigation for &lt; lg. Uses the same permission-filtered `items` as the desktop sidebar.
 */
export function MobileNavDrawer({ open, onClose, items, currentYear }: MobileNavDrawerProps) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 lg:hidden" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close menu"
        onClick={onClose}
      />
      <div
        className="absolute left-0 top-0 z-50 flex h-full w-[min(20rem,90vw)] min-w-0 flex-col border-r border-neutral-200 bg-white shadow-xl transition-transform duration-200 ease-out"
        role="dialog"
        aria-modal="true"
        aria-label="Main navigation"
      >
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <DashboardNavContent
            items={items}
            variant="drawer"
            onNavLinkClick={onClose}
            onDrawerClose={onClose}
            currentYear={currentYear}
          />
        </div>
      </div>
    </div>
  );
}
