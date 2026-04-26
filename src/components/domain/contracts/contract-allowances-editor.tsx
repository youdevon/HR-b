"use client";

import { useMemo, useState } from "react";
import { FormLabel } from "@/components/ui/form-primitives";
import {
  formCheckboxClass,
  formInputClass,
  formSecondaryButtonClass,
  formSelectClass,
} from "@/lib/ui/form-styles";
import { cn } from "@/lib/utils/cn";

export type ContractAllowanceDraft = {
  allowance_name: string;
  allowance_type: string;
  allowance_amount: string;
  allowance_frequency: "monthly" | "fortnightly" | "weekly" | "daily" | "one_time";
  is_taxable: boolean;
  notes: string;
};

type Props = {
  name?: string;
  canEditAmounts: boolean;
  initialAllowances?: ContractAllowanceDraft[];
};

const PRESET_ALLOWANCE_NAMES = [
  "Travelling Allowance",
  "Professional Allowance",
  "Housing Allowance",
  "Acting Allowance",
  "Telephone Allowance",
  "Custom Allowance",
] as const;

const FREQUENCY_OPTIONS: Array<ContractAllowanceDraft["allowance_frequency"]> = [
  "monthly",
  "fortnightly",
  "weekly",
  "daily",
  "one_time",
];

function normalizeType(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function createEmptyDraft(): ContractAllowanceDraft {
  return {
    allowance_name: "",
    allowance_type: "",
    allowance_amount: "",
    allowance_frequency: "monthly",
    is_taxable: false,
    notes: "",
  };
}

export default function ContractAllowancesEditor({
  name = "allowances_json",
  canEditAmounts,
  initialAllowances = [],
}: Props) {
  const [rows, setRows] = useState<ContractAllowanceDraft[]>(
    initialAllowances.length ? initialAllowances : []
  );

  const serialized = useMemo(() => JSON.stringify(rows), [rows]);

  const updateRow = (index: number, patch: Partial<ContractAllowanceDraft>) => {
    setRows((prev) =>
      prev.map((row, idx) => {
        if (idx !== index) return row;
        const next = { ...row, ...patch };
        if (patch.allowance_name !== undefined && patch.allowance_type === undefined) {
          next.allowance_type = normalizeType(next.allowance_name);
        }
        return next;
      })
    );
  };

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">Allowances</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Add any allowances included in this contract. You may use a standard allowance type or
            enter a custom allowance.
          </p>
        </div>
        <button type="button" onClick={() => setRows((prev) => [...prev, createEmptyDraft()])} className={formSecondaryButtonClass}>
          Add Allowance
        </button>
      </div>

      <input type="hidden" name={name} value={serialized} />

      {!rows.length ? (
        <p className="mt-4 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-3 text-sm text-neutral-600">
          No allowances added.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {rows.map((row, index) => (
            <article key={`allowance-${index}`} className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
                <label className="space-y-1.5">
                  <FormLabel>Allowance Name</FormLabel>
                  <select
                    value={PRESET_ALLOWANCE_NAMES.includes(row.allowance_name as never) ? row.allowance_name : "Custom Allowance"}
                    onChange={(event) => {
                      const selected = event.target.value;
                      if (selected === "Custom Allowance" && !row.allowance_name) {
                        updateRow(index, { allowance_name: "", allowance_type: "" });
                        return;
                      }
                      updateRow(index, { allowance_name: selected, allowance_type: normalizeType(selected) });
                    }}
                    className={formSelectClass}
                  >
                    {PRESET_ALLOWANCE_NAMES.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1.5">
                  <FormLabel>Custom Name (optional)</FormLabel>
                  <input
                    value={row.allowance_name}
                    onChange={(event) =>
                      updateRow(index, {
                        allowance_name: event.target.value,
                        allowance_type: normalizeType(event.target.value),
                      })
                    }
                    placeholder="Custom allowance name"
                    className={formInputClass}
                  />
                </label>

                <label className="space-y-1.5">
                  <FormLabel>Amount</FormLabel>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={row.allowance_amount}
                    onChange={(event) => updateRow(index, { allowance_amount: event.target.value })}
                    disabled={!canEditAmounts}
                    className={formInputClass}
                  />
                </label>

                <label className="space-y-1.5">
                  <FormLabel>Frequency</FormLabel>
                  <select
                    value={row.allowance_frequency}
                    onChange={(event) =>
                      updateRow(index, {
                        allowance_frequency: event.target.value as ContractAllowanceDraft["allowance_frequency"],
                      })
                    }
                    className={formSelectClass}
                  >
                    {FREQUENCY_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex h-10 items-center rounded-xl border border-neutral-300 bg-white px-3 text-sm text-neutral-800">
                  <input
                    type="checkbox"
                    checked={row.is_taxable}
                    onChange={(event) => updateRow(index, { is_taxable: event.target.checked })}
                    className={cn(formCheckboxClass, "mr-2")}
                  />
                  Taxable
                </label>

                <label className="space-y-1.5 xl:col-span-2">
                  <FormLabel>Notes</FormLabel>
                  <input
                    value={row.notes}
                    onChange={(event) => updateRow(index, { notes: event.target.value })}
                    placeholder="Optional notes"
                    className={formInputClass}
                  />
                </label>
              </div>

              <div className="mt-2">
                <button
                  type="button"
                  onClick={() => setRows((prev) => prev.filter((_, idx) => idx !== index))}
                  className={cn(formSecondaryButtonClass, "h-9 text-xs")}
                >
                  Remove row
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
