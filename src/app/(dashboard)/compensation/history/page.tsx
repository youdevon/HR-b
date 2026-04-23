const rows = [
  { id: "comp_1", employee_id: "emp_001", change_type: "Initial", salary_amount: "12000.00", effective_from: "2026-01-01" },
  { id: "comp_2", employee_id: "emp_001", change_type: "Increment", salary_amount: "13000.00", effective_from: "2026-10-01" },
];

export default function CompensationHistoryPage() {
  return (
    <main className="min-h-screen bg-neutral-100 p-6"><div className="mx-auto max-w-7xl space-y-6">
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200"><h1 className="text-2xl font-semibold">Compensation History</h1></section>
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 overflow-x-auto">
        <table className="min-w-full text-sm"><thead><tr><th className="p-2 text-left">Employee</th><th className="p-2 text-left">Change</th><th className="p-2 text-left">Salary</th><th className="p-2 text-left">Effective From</th></tr></thead><tbody>{rows.map((r) => <tr key={r.id}><td className="p-2">{r.employee_id}</td><td className="p-2">{r.change_type}</td><td className="p-2">{r.salary_amount}</td><td className="p-2">{r.effective_from}</td></tr>)}</tbody></table>
      </section>
    </div></main>
  );
}
