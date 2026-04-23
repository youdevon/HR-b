import Link from "next/link";

type Props = { params: { id: string } };

export default function CompensationDetailPage({ params }: Props) {
  const item = { employee_id: "emp_001", contract_id: "ctr_1", salary_amount: "12000.00", allowance_amount: "1500.00", status: "Active", change_type: "Initial", currency: "AED" };
  return (
    <main className="min-h-screen bg-neutral-100 p-6"><div className="mx-auto max-w-7xl space-y-6">
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 flex items-center justify-between">
        <div><h1 className="text-2xl font-semibold">Compensation {params.id}</h1><p className="text-sm text-neutral-600">{item.status}</p></div>
        <Link href="/compensation/current" className="rounded-xl border border-neutral-300 px-3 py-2 text-sm">Back</Link>
      </section>
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-sm">
        <div><p className="text-xs uppercase text-neutral-500">Employee</p><p>{item.employee_id}</p></div>
        <div><p className="text-xs uppercase text-neutral-500">Contract</p><p>{item.contract_id}</p></div>
        <div><p className="text-xs uppercase text-neutral-500">Salary</p><p>{item.salary_amount} {item.currency}</p></div>
        <div><p className="text-xs uppercase text-neutral-500">Allowance</p><p>{item.allowance_amount}</p></div>
        <div><p className="text-xs uppercase text-neutral-500">Change Type</p><p>{item.change_type}</p></div>
      </section>
    </div></main>
  );
}
