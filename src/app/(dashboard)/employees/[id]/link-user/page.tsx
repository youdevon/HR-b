import { notFound, redirect } from "next/navigation";
import PageHeader from "@/components/layout/page-header";
import { assertAnyPermission, getDashboardSession, requireDashboardAuth } from "@/lib/auth/guards";
import { hasAnyPermissionForContext, profileDisplayName } from "@/lib/auth/permissions";
import { getEmployeeById } from "@/lib/queries/employees";
import {
  getUserLinkedToEmployee,
  linkUserToEmployee,
  listUsers,
  unlinkUserFromEmployee,
} from "@/lib/queries/admin";
import LinkUserAccountForm, {
  UnlinkUserSection,
} from "@/components/domain/employees/link-user-account-form";
import { dashboardAlertErrorClass, dashboardAlertSuccessClass } from "@/lib/ui/dashboard-styles";

type LinkUserPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstString(value: string | string[] | undefined): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0];
  return undefined;
}

const LINK_PERMISSIONS = ["admin.users.edit", "admin.users.manage"];

export default async function LinkUserPage({ params, searchParams }: LinkUserPageProps) {
  const auth = await requireDashboardAuth();
  const canManageUsers = hasAnyPermissionForContext(auth.profile, auth.permissions, LINK_PERMISSIONS);
  if (!canManageUsers) redirect("/access-denied");

  const { id } = await params;
  const sp = await searchParams;
  const status = firstString(sp.status);
  const message = firstString(sp.message);
  const isLinked = firstString(sp.linked) === "1";
  const isUnlinked = firstString(sp.unlinked) === "1";

  const [employee, linkedUser, allUsers] = await Promise.all([
    getEmployeeById(id),
    getUserLinkedToEmployee(id),
    listUsers(),
  ]);

  if (!employee) notFound();

  const fullName = [employee.first_name, employee.last_name].filter(Boolean).join(" ") || "Employee";
  const actorUserId = auth.user.id;
  const actorName = auth.profile ? profileDisplayName(auth.profile) : "System";

  async function linkAction(formData: FormData) {
    "use server";
    await assertAnyPermission(LINK_PERMISSIONS);
    const userId = String(formData.get("user_id") ?? "").trim();
    const employeeId = String(formData.get("employee_id") ?? "").trim();
    if (!userId || !employeeId) {
      redirect(`/employees/${id}/link-user?status=error&message=${encodeURIComponent("Missing user or employee ID.")}`);
    }

    const session = await getDashboardSession();
    const actorId = session?.user.id ?? "";
    const actorDisplay = session?.profile ? profileDisplayName(session.profile) : "System";

    try {
      await linkUserToEmployee({
        userId,
        employeeId,
        actorUserId: actorId,
        actorDisplayName: actorDisplay,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to link user account.";
      redirect(`/employees/${id}/link-user?status=error&message=${encodeURIComponent(msg)}`);
    }

    redirect(`/employees/${id}/link-user?linked=1`);
  }

  async function unlinkAction(formData: FormData) {
    "use server";
    await assertAnyPermission(LINK_PERMISSIONS);
    const confirmed = String(formData.get("confirm_unlink") ?? "") === "on";
    if (!confirmed) {
      redirect(`/employees/${id}/link-user?status=error&message=${encodeURIComponent("Please confirm before unlinking.")}`);
    }

    const userId = String(formData.get("user_id") ?? "").trim();
    if (!userId) {
      redirect(`/employees/${id}/link-user?status=error&message=${encodeURIComponent("No linked user to unlink.")}`);
    }

    const session = await getDashboardSession();
    const actorId = session?.user.id ?? "";
    const actorDisplay = session?.profile ? profileDisplayName(session.profile) : "System";

    try {
      await unlinkUserFromEmployee({
        userId,
        employeeId: id,
        actorUserId: actorId,
        actorDisplayName: actorDisplay,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to unlink user account.";
      redirect(`/employees/${id}/link-user?status=error&message=${encodeURIComponent(msg)}`);
    }

    redirect(`/employees/${id}/link-user?unlinked=1`);
  }

  const userOptions = allUsers.map((u) => ({
    id: u.id,
    first_name: u.first_name,
    last_name: u.last_name,
    email: u.email,
    role_name: u.role_name,
    role_code: u.role_code,
    account_status: u.account_status,
    employee_id: u.employee_id,
  }));

  return (
    <main className="space-y-6">
      <PageHeader
        title="Link User Account"
        description={`Link a user login account to ${fullName}.`}
        backHref={`/employees/${id}`}
      />

      {isLinked ? (
        <section className={dashboardAlertSuccessClass}>User account linked successfully.</section>
      ) : null}
      {isUnlinked ? (
        <section className={dashboardAlertSuccessClass}>User account unlinked successfully.</section>
      ) : null}
      {message ? (
        <section className={status === "success" ? dashboardAlertSuccessClass : dashboardAlertErrorClass}>
          {message}
        </section>
      ) : null}

      <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-neutral-900">Employee Summary</h2>
        <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Name</p>
            <p className="text-neutral-900">{fullName}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">File Number</p>
            <p className="text-neutral-900">{employee.file_number ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Department</p>
            <p className="text-neutral-900">{employee.department ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Job Title</p>
            <p className="text-neutral-900">{employee.job_title ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Work Email</p>
            <p className="text-neutral-900">{employee.work_email ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Personal Email</p>
            <p className="text-neutral-900">{employee.personal_email ?? "—"}</p>
          </div>
        </div>
      </section>

      {linkedUser ? (
        <UnlinkUserSection linkedUser={linkedUser} unlinkAction={unlinkAction} />
      ) : (
        <section className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600">
          No user account is currently linked to this employee.
        </section>
      )}

      <LinkUserAccountForm
        employeeId={id}
        employeeAlreadyLinked={linkedUser !== null}
        users={userOptions}
        linkAction={linkAction}
      />
    </main>
  );
}
