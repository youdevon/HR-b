"use client";

import { useRouter } from "next/navigation";
import type { KeyboardEvent, ReactNode } from "react";
import { dashboardTableBodyRowClass } from "@/lib/ui/dashboard-styles";
import { cn } from "@/lib/utils/cn";

type ClickableTableRowProps = {
  href: string;
  className?: string;
  children: ReactNode;
};

export default function ClickableTableRow({
  href,
  className,
  children,
}: ClickableTableRowProps) {
  const router = useRouter();

  function handleKeyDown(event: KeyboardEvent<HTMLTableRowElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      router.push(href);
    }
  }

  return (
    <tr
      role="link"
      tabIndex={0}
      onClick={() => router.push(href)}
      onKeyDown={handleKeyDown}
      className={cn(
        dashboardTableBodyRowClass,
        "cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300",
        className,
      )}
    >
      {children}
    </tr>
  );
}
