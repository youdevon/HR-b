import Link from "next/link";
import { getAuthenticatedUserProfile } from "@/lib/auth/user";

function getInitials(name?: string | null): string {
  if (!name) return "G";

  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase() || "G";
}

export default async function Topbar() {
  const profile = await getAuthenticatedUserProfile().catch(() => null);

  const displayName: string = profile?.full_name || "Guest";
  const email: string = profile?.email || "Not signed in";
  const initials: string = getInitials(displayName);

  return (
    <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white/95 backdrop-blur">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        <div>
          <h1 className="text-base font-semibold text-neutral-900">
            HR Management System
          </h1>
          <p className="text-sm text-neutral-500">
            Dashboard workspace
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/alerts/active"
            className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Notifications
          </Link>

          <details className="group relative">
            <summary className="flex list-none cursor-pointer items-center gap-3 rounded-xl border border-neutral-200 bg-white px-3 py-2 hover:bg-neutral-50">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-900 text-sm font-semibold text-white">
                {initials}
              </div>

              <div className="hidden text-left sm:block">
                <p className="text-sm font-medium text-neutral-900">
                  {displayName}
                </p>
                <p className="text-xs text-neutral-500">
                  {email}
                </p>
              </div>
            </summary>

            <div className="absolute right-0 mt-2 hidden w-56 rounded-2xl border border-neutral-200 bg-white p-2 shadow-lg group-open:block">
              <Link
                href="/profile"
                className="block rounded-xl px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
              >
                My Profile
              </Link>

              <Link
                href="/profile/change-password"
                className="block rounded-xl px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
              >
                Change Password
              </Link>

              <Link
                href="/login"
                className="block rounded-xl px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
              >
                Logout
              </Link>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}