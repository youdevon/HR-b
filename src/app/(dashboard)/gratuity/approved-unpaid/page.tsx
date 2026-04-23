const rows = [
  { id: "gr_1", employee: "Ayesha Khan", approved_amount: "32000.00", payment_status: "Unpaid" },
];

export default function GratuityApprovedUnpaidPage() {
  return (
    <main className="min-h-screen bg-neutral-100 p-6"><div className="mx-auto max-w-7xl space-y-6">
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200"><h1 className="text-2xl font-semibold">Approved Unpaid</h1></section>
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 overflow-x-auto">
        <table className="min-w-full text-sm"><thead><tr><th className="p-2 text-left">Employee</th><th className="p-2 text-left">Approved Amount</th><th className="p-2 text-left">Status</th></tr></thead><tbody>{rows.map((r) => <tr key={r.id}><td className="p-2">{r.employee}</td><td className="p-2">{r.approved_amount}</td><td className="p-2">{r.payment_status}</td></tr>)}</tbody></table>
      </section>
    </div></main>
  );
}
