import Link from "next/link";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import PageHeader from "@/components/layout/page-header";
import {
  applyFileMovementAction,
  getFileMovementById,
  type FileMovementAction,
} from "@/lib/queries/file-movements";

type FileMovementDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const actionOptions: { value: FileMovementAction; label: string }[] = [
  { value: "check_out", label: "Check Out" },
  { value: "transfer", label: "Transfer" },
  { value: "return", label: "Return" },
  { value: "archive", label: "Archive" },
  { value: "mark_missing", label: "Mark Missing" },
];

function firstString(value: string | string[] | undefined): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0];
  return undefined;
}

function display(value: string | null | undefined): string {
  return value && value.trim() ? value : "—";
}

function redirectWithMessage(
  id: string,
  status: "success" | "error",
  message: string
): never {
  const qs = new URLSearchParams();
  qs.set("status", status);
  qs.set("message", message);
  redirect(`/file-movements/${id}?${qs.toString()}`);
}

export default async function FileMovementDetailPage({
  params,
  searchParams,
}: FileMovementDetailPageProps) {
  const { id } = await params;
  const sp = await searchParams;
  const status = firstString(sp.status);
  const message = firstString(sp.message);
  const movement = await getFileMovementById(id);

  if (!movement) notFound();
  const employeeId = movement.employee_id;

  async function applyAction(formData: FormData) {
    "use server";
    const action = String(formData.get("action") ?? "") as FileMovementAction;

    try {
      await applyFileMovementAction({
        id,
        action,
        movement_reason: String(formData.get("movement_reason") ?? ""),
        from_department: String(formData.get("from_department") ?? ""),
        to_department: String(formData.get("to_department") ?? ""),
        from_location: String(formData.get("from_location") ?? ""),
        to_location: String(formData.get("to_location") ?? ""),
        from_custodian: String(formData.get("from_custodian") ?? ""),
        to_custodian: String(formData.get("to_custodian") ?? ""),
        date_received: String(formData.get("date_received") ?? ""),
        remarks: String(formData.get("remarks") ?? ""),
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update file movement.";
      redirectWithMessage(id, "error", errorMessage);
    }

    revalidatePath("/file-movements");
    revalidatePath(`/file-movements/${id}`);
    if (employeeId) revalidatePath(`/employees/${employeeId}`);
    redirectWithMessage(id, "success", "File movement action saved.");
  }

  return (
    <main className="min-h-screen bg-neutral-100 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <PageHeader
          title="Physical File Movement"
          description={`${movement.employee_name ?? movement.employee_id ?? "Unlinked employee"} • File #${display(movement.file_number)} • Status ${display(movement.movement_status)}`}
          backHref="/file-movements"
        />

        {message ? (
          <section
            className={`rounded-2xl border p-4 text-sm ${
              status === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {message}
          </section>
        ) : null}

        <section className="grid gap-4 md:grid-cols-3">
          <Info label="Employee" value={display(movement.employee_name ?? movement.employee_id)} />
          <Info label="Employee #" value={display(movement.employee_number)} />
          <Info label="File Number" value={display(movement.file_number)} />
          <Info label="Current Holder" value={display(movement.current_holder)} />
          <Info label="Current Location" value={display(movement.current_location)} />
          <Info label="From Department" value={display(movement.from_department)} />
          <Info label="To Department" value={display(movement.to_department)} />
          <Info label="From Location" value={display(movement.from_location)} />
          <Info label="To Location" value={display(movement.to_location)} />
          <Info label="From Custodian" value={display(movement.from_custodian)} />
          <Info label="To Custodian" value={display(movement.to_custodian)} />
          <Info label="Movement Status" value={display(movement.movement_status)} />
          <Info label="Date Sent" value={display(movement.date_sent)} />
          <Info label="Date Received" value={display(movement.date_received)} />
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 sm:p-6">
          <h2 className="text-lg font-semibold text-neutral-900">Movement Details</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <TextBlock label="Movement Reason" value={movement.movement_reason} />
            <TextBlock label="Remarks" value={movement.remarks} />
          </div>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 sm:p-6">
          <h2 className="text-lg font-semibold text-neutral-900">Workflow Action</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Apply a file action and capture the movement handoff details.
          </p>
          <form action={applyAction} className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <select
              name="action"
              defaultValue="transfer"
              className="rounded-xl border border-neutral-300 px-3 py-2 text-sm"
            >
              {actionOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <input name="from_department" defaultValue={movement.from_department ?? ""} placeholder="From department" className="rounded-xl border border-neutral-300 px-3 py-2 text-sm" />
            <input name="to_department" placeholder="To department" className="rounded-xl border border-neutral-300 px-3 py-2 text-sm" />
            <input name="from_location" defaultValue={movement.current_location ?? movement.from_location ?? ""} placeholder="From location" className="rounded-xl border border-neutral-300 px-3 py-2 text-sm" />
            <input name="to_location" placeholder="To location" className="rounded-xl border border-neutral-300 px-3 py-2 text-sm" />
            <input name="from_custodian" defaultValue={movement.current_holder ?? movement.from_custodian ?? ""} placeholder="From custodian" className="rounded-xl border border-neutral-300 px-3 py-2 text-sm" />
            <input name="to_custodian" placeholder="To custodian / holder" className="rounded-xl border border-neutral-300 px-3 py-2 text-sm" />
            <input name="date_received" type="date" className="rounded-xl border border-neutral-300 px-3 py-2 text-sm" />
            <textarea name="movement_reason" placeholder="Movement reason" rows={3} className="rounded-xl border border-neutral-300 px-3 py-2 text-sm md:col-span-2" />
            <textarea name="remarks" placeholder="Remarks" rows={3} className="rounded-xl border border-neutral-300 px-3 py-2 text-sm md:col-span-2" />
            <button
              type="submit"
              className="w-fit rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
            >
              Save Action
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
