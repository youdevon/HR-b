type GratuitySummaryProps = {
  employeeName: string;
  status: string;
  calculatedAmount: string;
  reviewedAmount: string;
  approvedAmount: string;
};

export default function GratuitySummary({
  employeeName,
  status,
  calculatedAmount,
  reviewedAmount,
  approvedAmount,
}: GratuitySummaryProps) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200">
      <h2 className="text-lg font-semibold text-neutral-900">Gratuity Summary</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div><p className="text-xs uppercase text-neutral-500">Employee</p><p className="mt-1 text-sm">{employeeName}</p></div>
        <div><p className="text-xs uppercase text-neutral-500">Status</p><p className="mt-1 text-sm">{status}</p></div>
        <div><p className="text-xs uppercase text-neutral-500">Calculated</p><p className="mt-1 text-sm">{calculatedAmount}</p></div>
        <div><p className="text-xs uppercase text-neutral-500">Reviewed</p><p className="mt-1 text-sm">{reviewedAmount}</p></div>
        <div><p className="text-xs uppercase text-neutral-500">Approved</p><p className="mt-1 text-sm">{approvedAmount}</p></div>
      </div>
    </section>
  );
}
