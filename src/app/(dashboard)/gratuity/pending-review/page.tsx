import PageHeader from "@/components/layout/page-header";
import { requirePermission } from "@/lib/auth/guards";
import { listPendingGratuityCalculations } from "@/lib/queries/gratuity";

export default async function GratuityPendingReviewPage() {
  await requirePermission("gratuity.approve");
  const rows = await listPendingGratuityCalculations();

  return (
    <main className="space-y-6">
      <PageHeader
        title="Pending Review Gratuity"
        description="Gratuity calculations waiting for review and approval."
        backHref="/gratuity/calculations"
      />

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-neutral-600">
            No pending gratuity calculations.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-left text-neutral-500">
                  <th className="px-3 py-3 font-medium">Employee</th>
                  <th className="px-3 py-3 font-medium">Contract</th>
                  <th className="px-3 py-3 font-medium">Approved Amount</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-neutral-100">
                    <td className="px-3 py-3">
                      {row.employee_id ?? "—"}
                    </td>
                    <td className="px-3 py-3">
                      {row.contract_id ?? "—"}
                    </td>
                    <td className="px-3 py-3">
                      {row.approved_amount ?? "—"}
                    </td>
                    <td className="px-3 py-3">
                      {row.calculation_status ?? "—"}
                    </td>
                    <td className="px-3 py-3">
                      {row.created_at ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}