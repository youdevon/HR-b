import type { ReactNode } from "react";
import { dashboardEmptyCardClass } from "@/lib/ui/dashboard-styles";
import { cn } from "@/lib/utils/cn";

type EmptyStateCardProps = {
  children: ReactNode;
  className?: string;
};

export default function EmptyStateCard({ children, className }: EmptyStateCardProps) {
  return <div className={cn(dashboardEmptyCardClass, className)}>{children}</div>;
}
