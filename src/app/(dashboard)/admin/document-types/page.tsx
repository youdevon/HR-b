import PageHeader from "@/components/layout/page-header";

const types = [
  { id: "dt_1", name: "Employment Agreement", category: "Contract" },
  { id: "dt_2", name: "Passport Copy", category: "Employee" },
];

export default function AdminDocumentTypesPage() {
  return (
    <main className="space-y-6">
      <PageHeader title="Document Types" backHref="/settings" />
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 overflow-x-auto">
        <table className="min-w-full text-sm"><thead><tr><th className="p-2 text-left">Type</th><th className="p-2 text-left">Category</th></tr></thead><tbody>{types.map((t) => <tr key={t.id}><td className="p-2">{t.name}</td><td className="p-2">{t.category}</td></tr>)}</tbody></table>
      </section>
    </main>
  );
}
