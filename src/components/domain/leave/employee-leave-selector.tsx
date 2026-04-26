"use client";

import { useMemo, useState } from "react";
import { FormErrorAlert, FormLabel } from "@/components/ui/form-primitives";
import type { EmployeeLookupRecord } from "@/lib/queries/employees";
import { formInputClass } from "@/lib/ui/form-styles";

type EmployeeOption = EmployeeLookupRecord & { full_name: string };

type EmployeeLeaveSelectorProps = {
  options: EmployeeOption[];
  initialSelectedEmployeeId?: string;
};

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

export default function EmployeeLeaveSelector({
  options,
  initialSelectedEmployeeId = "",
}: EmployeeLeaveSelectorProps) {
  const initialSelected =
    options.find((option) => option.id === initialSelectedEmployeeId) ?? null;
  const [selected, setSelected] = useState<EmployeeOption | null>(initialSelected);
  const [searchInput, setSearchInput] = useState(
    initialSelected
      ? `${initialSelected.full_name} — ${initialSelected.file_number ?? ""}`
      : ""
  );
  const [lookupError, setLookupError] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const suggestions = useMemo(() => {
    const query = normalize(searchInput);
    if (!query) return options.slice(0, 10);
    return options
      .filter((option) => {
        const nameMatch = normalize(option.full_name).includes(query);
        const fileMatch = normalize(option.file_number ?? "").includes(query);
        const firstMatch = normalize(option.first_name ?? "").includes(query);
        const lastMatch = normalize(option.last_name ?? "").includes(query);
        return nameMatch || fileMatch || firstMatch || lastMatch;
      })
      .slice(0, 12);
  }, [options, searchInput]);

  function chooseEmployee(option: EmployeeOption) {
    setSelected(option);
    setSearchInput(`${option.full_name} — ${option.file_number ?? ""}`);
    setLookupError("");
    setIsFocused(false);
  }

  function clearSelection() {
    setSelected(null);
    setSearchInput("");
    setLookupError("");
  }

  function handleBlur() {
    setTimeout(() => setIsFocused(false), 200);
    if (!searchInput.trim()) {
      setSelected(null);
      return;
    }
    if (selected) return;
    const query = normalize(searchInput);
    const exactMatches = options.filter(
      (option) =>
        normalize(option.full_name) === query ||
        normalize(option.file_number ?? "") === query
    );
    if (exactMatches.length === 1) {
      chooseEmployee(exactMatches[0]);
      return;
    }
    if (exactMatches.length > 1) {
      setLookupError(
        "Multiple employees match. Please choose the correct employee from the list."
      );
      return;
    }
    setLookupError("No employee found. Search by name or file number and select from the list.");
  }

  const showSuggestions = isFocused && suggestions.length > 0;

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 sm:p-6">
      <h2 className="text-lg font-semibold text-neutral-900">Employee Selection</h2>
      <p className="mt-1 text-sm text-neutral-600">
        Search by employee name or file number to link this leave record.
      </p>

      <input type="hidden" name="employee_id" value={selected?.id ?? ""} />

      <div className="relative mt-4">
        <label className="space-y-1.5">
          <FormLabel required>Employee Name or File Number</FormLabel>
          <input
            value={searchInput}
            onChange={(event) => {
              setSearchInput(event.target.value);
              if (lookupError) setLookupError("");
              if (selected) {
                const val = normalize(event.target.value);
                const matchStr = normalize(
                  `${selected.full_name} — ${selected.file_number ?? ""}`
                );
                if (val !== matchStr) setSelected(null);
              }
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={handleBlur}
            placeholder="Type a name or file number to search..."
            autoComplete="off"
            className={formInputClass}
          />
        </label>

        {showSuggestions ? (
          <div className="absolute z-10 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-neutral-200 bg-white shadow-lg">
            {suggestions.map((option) => (
              <button
                type="button"
                key={option.id}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => chooseEmployee(option)}
                className={`flex w-full items-center gap-3 border-b border-neutral-100 px-4 py-2.5 text-left text-sm transition last:border-b-0 ${
                  selected?.id === option.id
                    ? "bg-neutral-900 text-white"
                    : "text-neutral-800 hover:bg-neutral-50"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{option.full_name}</span>
                  <span className="block truncate text-xs opacity-70">
                    File #: {option.file_number ?? "—"}
                    {option.department ? ` · ${option.department}` : ""}
                  </span>
                </div>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {lookupError ? <FormErrorAlert className="mt-3">{lookupError}</FormErrorAlert> : null}

      {selected ? (
        <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
          <p className="text-sm font-semibold text-neutral-900">Selected Employee</p>
          <div className="mt-2 grid gap-1 text-sm text-neutral-700 sm:grid-cols-2">
            <p>
              <span className="font-medium">Name:</span> {selected.full_name}
            </p>
            <p>
              <span className="font-medium">File Number:</span>{" "}
              {selected.file_number ?? "—"}
            </p>
            <p>
              <span className="font-medium">Department:</span>{" "}
              {selected.department ?? "—"}
            </p>
            <p>
              <span className="font-medium">Job Title:</span>{" "}
              {selected.job_title ?? "—"}
            </p>
          </div>
          <button
            type="button"
            onClick={clearSelection}
            className="mt-3 text-xs font-medium text-neutral-600 underline underline-offset-2 hover:text-neutral-900"
          >
            Clear selected employee
          </button>
        </div>
      ) : (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Please select an employee before creating leave.
        </p>
      )}
    </section>
  );
}
