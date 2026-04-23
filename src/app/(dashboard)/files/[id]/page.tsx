import Link from "next/link";

type FileMovementDetailPageProps = { params: { id: string } };

const mockById: Record<string, { [key: string]: string }> = {
  mov_1: {
    employee_id: "emp_001",
    file_number: "FILE-1001",
    from_department: "HR",
    to_department: "Finance",
    from_location: "Cabinet A3",
    to_location: "Finance Vault 1",
    from_custodian: "Sarah Ali",
    to_custodian: "Rami Noor",
    date_sent: "2026-04-01",
    date_received: "2026-04-02",
    movement_status: "received",
    movement_reason: "Payroll verification",
    remarks: "Returned in good condition.",
  },
};

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="mt-1 text-sm text-neutral-900">{value || "-"}</p>
    </div>
  );
}

export default function FileMovementDetailPage({ params }: FileMovementDetailPageProps) {
  const item = mockById[params.id] ?? {
    employee_id: "-",
    file_number: "-",
    from_department: "-",
    to_department: "-",
    from_location: "-",
    to_location: "-",
    from_custodian: "-",
    to_custodian: "-",
    date_sent: "-",
    date_received: "-",
    movement_status: "-",
    movement_reason: "-",
    remarks: "-",
  };

  return (
    <main className="min-h-screen bg-neutral-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">{item.file_number}</h1>
              <p className="mt-1 text-sm text-neutral-600">Movement status: {item.movement_status}</p>
            </div>
            <Link href="/files/movements" className="inline-flex w-fit items-center rounded-xl bg-white px-4 py-2 text-sm font-medium text-neutral-900 ring-1 ring-neutral-300 transition hover:bg-neutral-50">
              Back to Movements
            </Link>
          </div>
        </section>
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 sm:p-6">
          <h2 className="text-lg font-semibold text-neutral-900">Movement Summary</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Item label="Employee ID" value={item.employee_id} />
            <Item label="From Department" value={item.from_department} />
            <Item label="To Department" value={item.to_department} />
            <Item label="From Location" value={item.from_location} />
            <Item label="To Location" value={item.to_location} />
            <Item label="From Custodian" value={item.from_custodian} />
            <Item label="To Custodian" value={item.to_custodian} />
            <Item label="Date Sent" value={item.date_sent} />
            <Item label="Date Received" value={item.date_received} />
            <div className="sm:col-span-2 lg:col-span-3"><Item label="Movement Reason" value={item.movement_reason} /></div>
            <div className="sm:col-span-2 lg:col-span-3"><Item label="Remarks" value={item.remarks} /></div>
          </div>
        </section>
      </div>
    </main>
  );
}
