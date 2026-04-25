import Link from "next/link";
import PageHeader from "@/components/layout/page-header";
import { listGratuityRules } from "@/lib/queries/gratuity";

export default async function GratuityRulesPage() {
  const rules = await listGratuityRules();

  return (
    <main className="min-h-screen bg-neutral-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          title="Gratuity rules"
          description="Configured calculation rules from the database."
          backHref="/gratuity/calculations"
          actions={
          <Link
            href="/gratuity/calculations"
            className="inline-flex shrink-0 items-center justify-center rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
          >
            Calculations
          </Link>
          }
        />

        <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-neutral-600">
                  <th className="px-4 py-3">Rule</th>
                  <th className="px-4 py-3">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 bg-white text-sm text-neutral-700">
                {rules.map((r) => (
                  <tr key={r.id} className="transition hover:bg-neutral-50">
                    <td className="px-4 py-3 font-medium text-neutral-900">{r.rule_name ?? "—"}</td>
                    <td className="max-w-xl px-4 py-3 text-neutral-700">{r.description ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!rules.length ? (
            <div className="px-4 py-10 text-center text-sm text-neutral-600">No gratuity rules configured yet.</div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
