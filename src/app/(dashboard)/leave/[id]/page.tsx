import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import PageHeader from "@/components/layout/page-header";
import { assertPermission, getDashboardSession, requirePermission } from "@/lib/auth/guards";
import { hasAnyPermissionForContext } from "@/lib/auth/permissions";
import {
  applyLeaveAction,
  formatLeaveType,
  formatReadableDate,
  getLeaveTransactionById,
  type LeaveAction,
} from "@/lib/queries/leave";

type LeaveDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstString(value: string | string[] | undefined): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0];
  return undefined;
}

function display(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
}

function statusBadge(status: string | null | undefined): { label: string; className: string } {
  const s = (status ?? "").toLowerCase();
  switch (s) {
    case "approved":
      return { label: "Approved", className: "bg-emerald-100 text-emerald-800" };
    case "pending":
      return { label: "Pending Approval", className: "bg-amber-100 text-amber-800" };
    case "rejected":
      return { label: "Rejected", className: "bg-red-100 text-red-800" };
    case "cancelled":
      return { label: "Cancelled", className: "bg-neutral-200 text-neutral-700" };
    case "returned":
      return { label: "Returned", className: "bg-blue-100 text-blue-800" };
    default:
      return { label: display(status), className: "bg-neutral-100 text-neutral-700" };
  }
}

export default async function LeaveDetailPage({
  params,
  searchParams,
}: LeaveDetailPageProps) {
  await requirePermission("leave.view");
  const auth = await getDashboardSession();
  const profile = auth?.profile ?? null;
  const permissions = auth?.permissions ?? [];
  const canApprove = hasAnyPermissionForContext(profile, permissions, ["leave.approve"]);
  const canReject = hasAnyPermissionForContext(profile, permissions, ["leave.reject"]);
  const canCancel = hasAnyPermissionForContext(profile, permissions, ["leave.cancel"]);
  const canReturn = hasAnyPermissionForContext(profile, permissions, ["leave.return"]);
  const canUseWorkflow = canApprove || canReject || canCancel || canReturn;
  const { id } = await params;
  const sp = await searchParams;
  const msgStatus = firstString(sp.status);
  const message = firstString(sp.message);
  const leave = await getLeaveTransactionById(id);

  if (!leave) notFound();
  const employeeId = leave.employee_id;

  const leaveStatus = (leave.approval_status ?? leave.status ?? "").toLowerCase();
  const leaveType = (leave.leave_type ?? "").toLowerCase();
  const isPendingVacation = leaveStatus === "pending" && leaveType === "vacation_leave";
  const isPending = leaveStatus === "pending";
  const badge = statusBadge(leave.approval_status ?? leave.status);

  function redirectWithMessage(nextStatus: "success" | "error", nextMessage: string): never {
    const qs = new URLSearchParams();
    qs.set("status", nextStatus);
    qs.set("message", nextMessage);
    redirect(`/leave/${id}?${qs.toString()}`);
  }

  async function approveAction() {
    "use server";
    await assertPermission("leave.approve");
    try {
      await applyLeaveAction({ id, action: "approve_leave" });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to approve leave.";
      const qs = new URLSearchParams();
      qs.set("status", "error");
      qs.set("message", errorMessage);
      redirect(`/leave/${id}?${qs.toString()}`);
    }
    revalidatePath(`/leave/${id}`);
    revalidatePath("/leave");
    revalidatePath("/leave/transactions");
    if (employeeId) revalidatePath(`/employees/${employeeId}`);
    const qs = new URLSearchParams();
    qs.set("status", "success");
    qs.set("message", "Leave approved and balance deducted successfully.");
    redirect(`/leave/${id}?${qs.toString()}`);
  }

  async function rejectAction(formData: FormData) {
    "use server";
    await assertPermission("leave.reject");
    const rejectionReason = String(formData.get("rejection_reason") ?? "").trim();
    try {
      await applyLeaveAction({ id, action: "reject_leave", rejection_reason: rejectionReason });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to reject leave.";
      const qs = new URLSearchParams();
      qs.set("status", "error");
      qs.set("message", errorMessage);
      redirect(`/leave/${id}?${qs.toString()}`);
    }
    revalidatePath(`/leave/${id}`);
    revalidatePath("/leave");
    revalidatePath("/leave/transactions");
    if (employeeId) revalidatePath(`/employees/${employeeId}`);
    const qs = new URLSearchParams();
    qs.set("status", "success");
    qs.set("message", "Leave rejected.");
    redirect(`/leave/${id}?${qs.toString()}`);
  }

  async function workflowAction(formData: FormData) {
    "use server";
    const action = String(formData.get("action") ?? "") as LeaveAction;
    if (action === "approve_leave") await assertPermission("leave.approve");
    if (action === "reject_leave") await assertPermission("leave.reject");
    if (action === "cancel_leave") await assertPermission("leave.cancel");
    if (action === "return_from_leave") await assertPermission("leave.return");

    try {
      await applyLeaveAction({
        id,
        action,
        approved_by: String(formData.get("approved_by") ?? ""),
        rejection_reason: String(formData.get("rejection_reason") ?? ""),
        return_to_work_date: String(formData.get("return_to_work_date") ?? ""),
        notes: String(formData.get("notes") ?? ""),
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update leave workflow.";
      redirectWithMessage("error", errorMessage);
    }

    revalidatePath(`/leave/${id}`);
    revalidatePath("/leave");
    revalidatePath("/leave/transactions");
    if (employeeId) revalidatePath(`/employees/${employeeId}`);
    redirectWithMessage("success", "Leave workflow updated successfully.");
  }

  return (
    <main className="space-y-6">
        <PageHeader
          title="Leave Request"
          description={`${leave.employee_name ?? leave.employee_id ?? "Unlinked employee"} • Employee #: ${leave.employee_number ?? "—"} • ID: ${leave.employee_id ?? "—"}`}
          backHref="/leave"
        />

        {message ? (
          <section
            className={`rounded-2xl border p-4 text-sm ${
              msgStatus === "error"
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-800"
            }`}
          >
            {message}
          </section>
        ) : null}

        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 sm:p-6">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-neutral-900">Status</h2>
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}>
              {badge.label}
            </span>
          </div>
          {leaveStatus === "approved" && leaveType === "sick_leave" ? (
            <p className="mt-2 text-sm text-neutral-600">
              Sick leave was automatically approved and deducted from the balance upon creation.
            </p>
          ) : null}
          {isPendingVacation ? (
            <p className="mt-2 text-sm text-neutral-600">
              This vacation leave request is awaiting approval. Balance will be deducted upon approval.
            </p>
          ) : null}
          {isPending && leaveType !== "vacation_leave" ? (
            <p className="mt-2 text-sm text-neutral-600">
              This leave request is awaiting approval.
            </p>
          ) : null}
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <Info label="Employee" value={display(leave.employee_name ?? leave.employee_id)} />
          <Info label="Leave Type" value={formatLeaveType(leave.leave_type)} />
          <Info label="Transaction Type" value={display(leave.transaction_type)} />
          <Info label="Total Days" value={display(leave.total_days)} />
          <Info label="Start Date" value={formatReadableDate(leave.start_date)} />
          <Info label="End Date" value={formatReadableDate(leave.end_date)} />
          <Info label="Return to Work" value={formatReadableDate(leave.return_to_work_date)} />
          <Info label="Entitlement" value={display(leave.entitlement_days)} />
          <Info label="Days Taken" value={display(leave.days_taken)} />
          <Info label="Balance" value={display(leave.balance_days)} />
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 sm:p-6">
          <h2 className="text-lg font-semibold text-neutral-900">Leave Details</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <TextBlock label="Reason" value={leave.reason} />
            <TextBlock label="Notes" value={leave.notes} />
            <Info label="Medical Certificate Required" value={display(leave.medical_certificate_required)} />
            <Info label="Medical Certificate Received" value={display(leave.medical_certificate_received)} />
            <Info label="Rejection Reason" value={display(leave.rejection_reason)} />
          </div>
        </section>

        {isPending && canApprove ? (
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 sm:p-6">
          <h2 className="text-lg font-semibold text-neutral-900">
            {isPendingVacation ? "Approve Vacation Leave" : "Approve Leave"}
          </h2>
          <p className="mt-1 text-sm text-neutral-600">
            {isPendingVacation
              ? "Approving this request will deduct the days from the employee's vacation leave balance."
              : "Approving this request will deduct the days from the employee's leave balance."}
          </p>
          <form action={approveAction} className="mt-4">
            <button
              type="submit"
              className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Approve Leave
            </button>
          </form>
        </section>
        ) : null}

        {isPending && canReject ? (
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 sm:p-6">
          <h2 className="text-lg font-semibold text-neutral-900">Reject Leave</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Rejecting this request will not affect the leave balance.
          </p>
          <form action={rejectAction} className="mt-4 space-y-3">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-neutral-700">Rejection Reason</span>
              <input
                name="rejection_reason"
                required
                placeholder="Reason for rejection"
                className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
              />
            </label>
            <button
              type="submit"
              className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-700"
            >
              Reject Leave
            </button>
          </form>
        </section>
        ) : null}

        {canUseWorkflow ? (
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 sm:p-6">
          <h2 className="text-lg font-semibold text-neutral-900">Other Workflow Actions</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Cancel or record return from leave.
          </p>
          <form action={workflowAction} className="mt-4 grid gap-3 md:grid-cols-2">
            <select
              name="action"
              defaultValue={canCancel ? "cancel_leave" : "return_from_leave"}
              className="rounded-xl border border-neutral-300 px-3 py-2 text-sm"
            >
              {canCancel ? <option value="cancel_leave">Cancel Leave</option> : null}
              {canReturn ? <option value="return_from_leave">Return From Leave</option> : null}
            </select>
            <input
              name="approved_by"
              placeholder="Approved by"
              className="rounded-xl border border-neutral-300 px-3 py-2 text-sm"
            />
            <input
              name="return_to_work_date"
              type="date"
              defaultValue={leave.return_to_work_date ?? ""}
              className="rounded-xl border border-neutral-300 px-3 py-2 text-sm"
            />
            <input
              name="rejection_reason"
              placeholder="Rejection reason"
              className="rounded-xl border border-neutral-300 px-3 py-2 text-sm"
            />
            <textarea
              name="notes"
              placeholder="Workflow notes"
              rows={4}
              className="md:col-span-2 rounded-xl border border-neutral-300 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="w-fit rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
            >
              Save Leave Action
            </button>
          </form>
        </section>
        ) : null}
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-200">
      <p className="text-xs uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-neutral-900">{value}</p>
    </div>
  );
}

function TextBlock({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
      <p className="text-xs uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-800">
        {display(value)}
      </p>
    </div>
  );
}
