import Link from "next/link";
import PageHeader from "@/components/layout/page-header";
import ClickableTableRow from "@/components/ui/clickable-table-row";
import { listRoles } from "@/lib/queries/admin";
import { requirePermission } from "@/lib/auth/guards";
import {
  dashboardButtonPrimaryClass,
  dashboardPanelClass,
  dashboardTableCellClass,
  dashboardTableHeadCellClass,
  dashboardTableHeadRowClass,
} from "@/lib/ui/dashboard-styles";
import { cn } from "@/lib/utils/cn";

function formatDate(value: string | null): string {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
}

export default async function AdminRolesPage() {
  await requirePermission("admin.roles.view");
  const roles = await listRoles();

  return (
    <main className="space-y-6">
        <PageHeader
          title="Roles"
          description="Manage roles and assigned permissions."
          backHref="/settings"
          actions={
            <>
              <span className="inline-flex h-fit rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700">
                {roles.length} total
              </span>
              <Link href="/admin/roles/new" className={dashboardButtonPrimaryClass}>
                New Role
              </Link>
            </>
          }
        />
        <section className={cn(dashboardPanelClass, "overflow-x-auto")}>
          <table className="min-w-full">
            <thead>
              <tr className={dashboardTableHeadRowClass}>
                <th className={dashboardTableHeadCellClass}>Role Name</th>
                <th className={dashboardTableHeadCellClass}>Role Code</th>
                <th className={dashboardTableHeadCellClass}>Description</th>
                <th className={dashboardTableHeadCellClass}>Active</th>
                <th className={dashboardTableHeadCellClass}>System</th>
                <th className={dashboardTableHeadCellClass}>Created At</th>
              </tr>
            </thead>
            <tbody>
              {roles.length ? (
                roles.map((role) => (
                  <ClickableTableRow key={role.id} href={`/admin/roles/${role.id}/edit`}>
                    <td className={cn(dashboardTableCellClass, "font-medium text-neutral-900")}>{role.role_name ?? "—"}</td>
                    <td className={cn(dashboardTableCellClass, "font-mono text-xs text-neutral-700")}>{role.role_code ?? "—"}</td>
                    <td className={dashboardTableCellClass}>{role.description ?? "—"}</td>
                    <td className={dashboardTableCellClass}>{role.is_active === false ? "No" : "Yes"}</td>
                    <td className={dashboardTableCellClass}>{role.is_system_role ? "Yes" : "No"}</td>
                    <td className={dashboardTableCellClass}>{formatDate(role.created_at)}</td>
                  </ClickableTableRow>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-sm text-neutral-500">
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
