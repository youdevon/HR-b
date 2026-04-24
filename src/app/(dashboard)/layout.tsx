import type { ReactNode } from "react";
import AppShell from "@/components/layout/app-shell";
import { requireUser } from "@/lib/auth/guards";

type DashboardLayoutProps = {
  children: ReactNode;
};

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  await requireUser({ redirectTo: "/login" });
  return <AppShell>{children}</AppShell>;
}