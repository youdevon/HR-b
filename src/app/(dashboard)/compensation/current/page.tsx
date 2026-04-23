const rows = [{ id: "comp_1", employee_id: "emp_001", salary_amount: "12000.00 AED", frequency: "Monthly", status: "Active" }];

export default function CompensationCurrentPage() {
  return (
    <main className="min-h-screen bg-neutral-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200"><h1 className="text-2xl font-semibold">Current Compensation</h1></section>
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 overflow-x-auto">
          <table className="min-w-full text-sm"><thead><tr><th className="p-2 text-left">Employee</th><th className="p-2 text-left">Salary</th><th className="p-2 text-left">Frequency</th><th className="p-2 text-left">Status</th></tr></thead><tbody>{rows.map((r) => <tr key={r.id}><td className="p-2">{r.employee_id}</td><td className="p-2">{r.salary_amount}</td><td className="p-2">{r.frequency}</td><td className="p-2">{r.status}</td></tr>)}</tbody></table>
        </section>
      </div>
    </main>
  );
}
