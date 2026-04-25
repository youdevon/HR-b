import Link from "next/link";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import PageHeader from "@/components/layout/page-header";
import {
  applyLeaveAction,
  formatLeaveType,
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

export default async function LeaveDetailPage({
  params,
  searchParams,
}: LeaveDetailPageProps) {
  const { id } = await params;
  const sp = await searchParams;
  const status = firstString(sp.status);
  const message = firstString(sp.message);
  const leave = await getLeaveTransactionById(id);

  if (!leave) notFound();
  const employeeId = leave.employee_id;

  function redirectWithMessage(nextStatus: "success" | "error", nextMessage: string): never {
    const qs = new URLSearchParams();
    qs.set("status", nextStatus);
    qs.set("message", nextMessage);
    redirect(`/leave/${id}?${qs.toString()}`);
  }

  async function workflowAction(formData: FormData) {
    "use server";
    const action = String(formData.get("action") ?? "") as LeaveAction;

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
    <main className="min-h-screen bg-neutral-100 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <PageHeader
          title="Leave Request"
          description={`${leave.employee_name ?? leave.employee_id ?? "Unlinked employee"} • Employee #: ${leave.employee_number ?? "—"} • ID: ${leave.employee_id ?? "—"}`}
          backHref="/leave"
        />

        {message ? (
          <section
            className={`rounded-2xl border p-4 text-sm ${
              status === "error"
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-800"
            }`}
          >
            {message}
          </section>
        ) : null}

        <section className="grid gap-4 md:grid-cols-3">
          <Info label="Employee" value={display(leave.employee_name ?? leave.employee_id)} />
          <Info label="Leave Type" value={formatLeaveType(leave.leave_type)} />
          <Info label="Transaction Type" value={display(leave.transaction_type)} />
          <Info label="Approval Status" value={display(leave.approval_status)} />
          <Info label="Total Days" value={display(leave.total_days)} />
          <Info label="Start Date" value={display(leave.start_date)} />
          <Info label="End Date" value={display(leave.end_date)} />
          <Info label="Return to Work" value={display(leave.return_to_work_date)} />
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

        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 sm:p-6">
          <h2 className="text-lg font-semibold text-neutral-900">Workflow Actions</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Approve, reject, cancel, or record return from leave.
          </p>
          <form action={workflowAction} className="mt-4 grid gap-3 md:grid-cols-2">
            <select
              name="action"
              defaultValue="approve_leave"
              className="rounded-xl border border-neutral-300 px-3 py-2 text-sm"
            >
              <option value="approve_leave">Approve Leave</option>
              <option value="reject_leave">Reject Leave</option>
              <option value="cancel_leave">Cancel Leave</option>
              <option value="return_from_leave">Return From Leave</option>
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
      </div>
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
