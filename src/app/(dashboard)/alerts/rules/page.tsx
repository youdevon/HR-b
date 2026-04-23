const rules = [
  { id: "rule_1", name: "Low Sick Leave", condition: "sick_leave_balance <= 3", enabled: "Yes" },
  { id: "rule_2", name: "Document Expiry", condition: "expiry_date <= 30 days", enabled: "Yes" },
];

export default function AlertRulesPage() {
  return (
    <main className="min-h-screen bg-neutral-100 p-6"><div className="mx-auto max-w-7xl space-y-6">
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200"><h1 className="text-2xl font-semibold">Alert Rules</h1></section>
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 overflow-x-auto">
        <table className="min-w-full text-sm"><thead><tr><th className="p-2 text-left">Rule</th><th className="p-2 text-left">Condition</th><th className="p-2 text-left">Enabled</th></tr></thead><tbody>{rules.map((r) => <tr key={r.id}><td className="p-2">{r.name}</td><td className="p-2">{r.condition}</td><td className="p-2">{r.enabled}</td></tr>)}</tbody></table>
      </section>
    </div></main>
  );
}
