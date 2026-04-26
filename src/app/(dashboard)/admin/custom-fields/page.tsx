import PageHeader from "@/components/layout/page-header";

const fields = [
  { id: "cf_1", module: "employees", field_name: "nationality", field_type: "text" },
  { id: "cf_2", module: "contracts", field_name: "union_code", field_type: "text" },
];

export default function AdminCustomFieldsPage() {
  return (
    <main className="space-y-6">
      <PageHeader title="Custom Fields" backHref="/settings" />
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 overflow-x-auto">
        <table className="min-w-full text-sm"><thead><tr><th className="p-2 text-left">Module</th><th className="p-2 text-left">Field Name</th><th className="p-2 text-left">Type</th></tr></thead><tbody>{fields.map((f) => <tr key={f.id}><td className="p-2">{f.module}</td><td className="p-2">{f.field_name}</td><td className="p-2">{f.field_type}</td></tr>)}</tbody></table>
      </section>
    </main>
  );
}
