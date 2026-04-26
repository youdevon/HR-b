import {
  listLoginActivity,
  listUsers,
  type AdminUserRecord,
  type LoginActivityRecord,
} from "@/lib/queries/admin";
import Link from "next/link";
import PageHeader from "@/components/layout/page-header";
import { requirePermission } from "@/lib/auth/guards";
import ClickableTableRow from "@/components/ui/clickable-table-row";
import EmptyStateCard from "@/components/ui/empty-state-card";
import {
  dashboardAlertErrorClass,
  dashboardAlertSuccessClass,
  dashboardButtonPrimaryClass,
  dashboardPanelClass,
  dashboardTableBodyRowClass,
  dashboardTableCellClass,
  dashboardTableHeadCellClass,
  dashboardTableHeadRowClass,
} from "@/lib/ui/dashboard-styles";
import { cn } from "@/lib/utils/cn";

type AdminUsersPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstString(value: string | string[] | undefined): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0];
  return undefined;
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
}

function displayFullName(user: AdminUserRecord): string {
  const fullName = `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim();
  return fullName || "—";
}

function accountStatusBadgeClass(status: string | null): string {
  const normalized = (status ?? "").trim().toLowerCase();
  if (normalized === "active") return "bg-emerald-100 text-emerald-800";
  if (normalized === "pending") return "bg-amber-100 text-amber-800";
  if (normalized === "disabled" || normalized === "locked") return "bg-neutral-100 text-neutral-700";
  return "bg-neutral-100 text-neutral-700";
}

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  const sp = await searchParams;
  await requirePermission("admin.users.view");
  const status = firstString(sp.status);
  const message = firstString(sp.message);
  const deleted = firstString(sp.deleted);
  const deactivated = firstString(sp.deactivated);
  const [users, loginActivity] = await Promise.all([
    listUsers(),
    listLoginActivity(),
  ]);

  return (
    <main className="space-y-6">
        <PageHeader
          title="Users"
          description="Manage system user accounts and access."
          backHref="/settings"
          actions={
            <Link
              href="/admin/users/new"
              className={dashboardButtonPrimaryClass}
            >
              New User
            </Link>
          }
        />

        {deleted === "1" ? (
          <section className={dashboardAlertSuccessClass}>
            User account deleted successfully.
          </section>
        ) : null}
        {deactivated === "1" ? (
          <section className={dashboardAlertSuccessClass}>
            User account deactivated successfully.
          </section>
        ) : null}

        {message ? (
          <section className={status === "success" ? dashboardAlertSuccessClass : dashboardAlertErrorClass}>
            {message}
          </section>
        ) : null}

        <section className={cn(dashboardPanelClass, "overflow-x-auto")}>
          <h2 className="mb-4 text-lg font-semibold text-neutral-900">Users</h2>
          <table className="min-w-full">
            <thead>
              <tr className={dashboardTableHeadRowClass}>
                <th className={dashboardTableHeadCellClass}>Full name</th>
                <th className={dashboardTableHeadCellClass}>Email</th>
                <th className={dashboardTableHeadCellClass}>Role</th>
                <th className={dashboardTableHeadCellClass}>Account Status</th>
              </tr>
            </thead>
            <tbody>
              {users.length ? (
                users.map((user: AdminUserRecord) => (
                  <ClickableTableRow key={user.id} href={`/admin/users/${user.id}/edit`}>
                    <td className={cn(dashboardTableCellClass, "font-medium text-neutral-900")}>
                      {displayFullName(user)}
                    </td>
                    <td className={dashboardTableCellClass}>{user.email ?? "—"}</td>
                    <td className={dashboardTableCellClass}>
                      {user.role_name || user.role_code ? (
                        <span className="font-medium text-neutral-900">
                          {user.role_name ?? user.role_code}
                        </span>
                      ) : (
                        <span className="text-neutral-400">Unassigned</span>
                      )}
                    </td>
                    <td className={dashboardTableCellClass}>
                      <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-medium", accountStatusBadgeClass(user.account_status))}>
                        {user.account_status ?? "Unknown"}
                      </span>
                    </td>
                  </ClickableTableRow>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-sm text-neutral-500">
                    No records found for the selected criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        <section className={cn(dashboardPanelClass, "overflow-x-auto")}>
          <h2 className="mb-4 text-lg font-semibold text-neutral-900">Login Activity</h2>
          <table className="min-w-full">
            <thead>
              <tr className={dashboardTableHeadRowClass}>
                <th className={dashboardTableHeadCellClass}>User ID</th>
                <th className={dashboardTableHeadCellClass}>Email</th>
                <th className={dashboardTableHeadCellClass}>Activity</th>
                <th className={dashboardTableHeadCellClass}>IP Address</th>
                <th className={dashboardTableHeadCellClass}>Created At</th>
              </tr>
            </thead>
            <tbody>
              {loginActivity.length ? (
                loginActivity.map((entry: LoginActivityRecord) => (
                  <tr key={entry.id} className={dashboardTableBodyRowClass}>
                    <td className={cn(dashboardTableCellClass, "font-mono text-xs text-neutral-800")}>{entry.user_id ?? "—"}</td>
                    <td className={dashboardTableCellClass}>{entry.user_email ?? "—"}</td>
                    <td className={dashboardTableCellClass}>{entry.activity_type ?? "login"}</td>
                    <td className={cn(dashboardTableCellClass, "font-mono text-xs text-neutral-700")}>{entry.ip_address ?? "—"}</td>
                    <td className={dashboardTableCellClass}>{formatDate(entry.created_at)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-sm text-neutral-500">
                    No records found for the selected criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
    
    </main>
  );
}