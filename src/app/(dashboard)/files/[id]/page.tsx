import Link from "next/link";
import { notFound } from "next/navigation";
import { getFileMovementById } from "@/lib/queries/files";

type FileMovementDetailPageProps = {
  params: Promise<{ id: string }>;
};

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="mt-1 text-sm text-neutral-900">{value || "-"}</p>
    </div>
  );
}

export default async function FileMovementDetailPage({ params }: FileMovementDetailPageProps) {
  const { id } = await params;
  const item = await getFileMovementById(id);

  if (!item) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-neutral-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">{item.file_number ?? "File movement"}</h1>
              <p className="mt-1 text-sm text-neutral-600">Movement status: {item.movement_status ?? "-"}</p>
            </div>
            <Link
              href="/files/movements"
              className="inline-flex w-fit items-center rounded-xl bg-white px-4 py-2 text-sm font-medium text-neutral-900 ring-1 ring-neutral-300 transition hover:bg-neutral-50"
            >
              Back to movements
            </Link>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 sm:p-6">
          <h2 className="text-lg font-semibold text-neutral-900">Movement summary</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Item label="Employee ID" value={item.employee_id ?? ""} />
            <Item label="From department" value={item.from_department ?? ""} />
            <Item label="To department" value={item.to_department ?? ""} />
            <Item label="From location" value={item.from_location ?? ""} />
            <Item label="To location" value={item.to_location ?? ""} />
            <Item label="From custodian" value={item.from_custodian ?? ""} />
            <Item label="To custodian" value={item.to_custodian ?? ""} />
            <Item label="Date sent" value={item.date_sent ?? ""} />
            <Item label="Date received" value={item.date_received ?? ""} />
            <div className="sm:col-span-2 lg:col-span-3">
              <Item label="Movement reason" value={item.movement_reason ?? ""} />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <Item label="Remarks" value={item.remarks ?? ""} />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
