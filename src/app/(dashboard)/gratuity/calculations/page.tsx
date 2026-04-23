import Link from "next/link";

const rows = [
  { id: "gr_1", employee: "Ayesha Khan", status: "Approved", amount: "32000.00" },
  { id: "gr_2", employee: "Mark Dela Cruz", status: "Pending Review", amount: "18000.00" },
];

export default function GratuityCalculationsPage() {
  return (
    <main className="min-h-screen bg-neutral-100 p-6"><div className="mx-auto max-w-7xl space-y-6">
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200"><h1 className="text-2xl font-semibold">Gratuity Calculations</h1></section>
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 overflow-x-auto">
        <table className="min-w-full text-sm"><thead><tr><th className="p-2 text-left">Employee</th><th className="p-2 text-left">Status</th><th className="p-2 text-left">Amount</th></tr></thead><tbody>{rows.map((r) => <tr key={r.id}><td className="p-2"><Link href={`/gratuity/${r.id}`} className="hover:underline">{r.employee}</Link></td><td className="p-2">{r.status}</td><td className="p-2">{r.amount}</td></tr>)}</tbody></table>
      </section>
    </div></main>
  );
}
