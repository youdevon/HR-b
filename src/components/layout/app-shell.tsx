import type { ReactNode } from "react";
import Sidebar from "@/components/navigation/sidebar";
import Topbar from "@/components/navigation/topbar";

type AppShellProps = {
  children: ReactNode;
};

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 border-r border-neutral-200 bg-white lg:block">
          <Sidebar />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />

          <main className="flex-1">
            <div className="mx-auto max-w-7xl p-4 sm:p-6">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}