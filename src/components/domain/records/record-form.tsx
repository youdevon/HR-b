import { RECORD_CATEGORIES, RECORD_TYPES } from "@/lib/queries/records";

type RecordFormProps = {
  employeeId?: string;
  submitLabel?: string;
};

export default function RecordForm({
  employeeId = "",
  submitLabel = "Create Record",
}: RecordFormProps) {
  return (
    <>
      <input type="hidden" name="employee_id" value={employeeId} />
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 sm:p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <label className="space-y-1.5">
            <span className="text-sm font-medium text-neutral-700">Employee ID</span>
            <input
              value={employeeId}
              readOnly
              placeholder="Optional"
              className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-700 placeholder:text-neutral-400"
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-sm font-medium text-neutral-700">Record Title</span>
            <input
              name="record_title"
              required
              className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-sm font-medium text-neutral-700">Record Type</span>
            <select
              name="record_type"
              defaultValue={RECORD_TYPES[0]}
              className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
            >
              {RECORD_TYPES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1.5">
            <span className="text-sm font-medium text-neutral-700">Record Category</span>
            <select
              name="record_category"
              defaultValue={RECORD_CATEGORIES[0]}
              className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
            >
              {RECORD_CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1.5">
            <span className="text-sm font-medium text-neutral-700">Record Date</span>
            <input
              name="record_date"
              type="date"
              className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-sm font-medium text-neutral-700">Reference Number</span>
            <input
              name="reference_number"
              className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-sm font-medium text-neutral-700">Status</span>
            <input
              name="status"
              required
              defaultValue="active"
              className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
            />
          </label>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="space-y-1.5">
            <span className="text-sm font-medium text-neutral-700">Description</span>
            <textarea
              name="description"
              rows={4}
              className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-sm font-medium text-neutral-700">Notes</span>
            <textarea
              name="notes"
              rows={4}
              className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
            />
          </label>
        </div>
      </section>
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-200">
        <button
          type="submit"
          className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
        >
          {submitLabel}
        </button>
      </div>
    </>
  );
}
