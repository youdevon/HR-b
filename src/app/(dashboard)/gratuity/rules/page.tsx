const rules = [
  { id: "rule_1", name: "Standard UAE Rule", formula: "21 days per year first 5 years" },
  { id: "rule_2", name: "Long Service Rule", formula: "30 days per year after 5 years" },
];

export default function GratuityRulesPage() {
  return (
    <main className="min-h-screen bg-neutral-100 p-6"><div className="mx-auto max-w-7xl space-y-6">
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200"><h1 className="text-2xl font-semibold">Gratuity Rules</h1></section>
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 overflow-x-auto">
        <table className="min-w-full text-sm"><thead><tr><th className="p-2 text-left">Rule</th><th className="p-2 text-left">Formula</th></tr></thead><tbody>{rules.map((r) => <tr key={r.id}><td className="p-2">{r.name}</td><td className="p-2">{r.formula}</td></tr>)}</tbody></table>
      </section>
    </div></main>
  );
}
