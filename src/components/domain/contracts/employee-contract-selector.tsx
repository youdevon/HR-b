"use client";

import { useMemo, useState } from "react";
import type { EmployeeLookupRecord } from "@/lib/queries/employees";

type EmployeeOption = EmployeeLookupRecord & { full_name: string };

type EmployeeContractSelectorProps = {
  options: EmployeeOption[];
  initialSelectedEmployeeId?: string;
};

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

export default function EmployeeContractSelector({
  options,
  initialSelectedEmployeeId = "",
}: EmployeeContractSelectorProps) {
  const initialSelected =
    options.find((option) => option.id === initialSelectedEmployeeId) ?? null;
  const [selected, setSelected] = useState<EmployeeOption | null>(initialSelected);
  const [nameInput, setNameInput] = useState(initialSelected?.full_name ?? "");
  const [fileInput, setFileInput] = useState(initialSelected?.file_number ?? "");
  const [lookupError, setLookupError] = useState("");

  const suggestions = useMemo(() => {
    const nameQuery = normalize(nameInput);
    const fileQuery = normalize(fileInput);
    if (!nameQuery && !fileQuery) {
      return options.slice(0, 8);
    }
    return options
      .filter((option) => {
        const nameMatch = nameQuery
          ? normalize(option.full_name).includes(nameQuery)
          : true;
        const fileMatch = fileQuery
          ? normalize(option.file_number ?? "").includes(fileQuery)
          : true;
        return nameMatch && fileMatch;
      })
      .slice(0, 12);
  }, [options, nameInput, fileInput]);

  function chooseEmployee(option: EmployeeOption) {
    setSelected(option);
    setNameInput(option.full_name);
    setFileInput(option.file_number ?? "");
    setLookupError("");
  }

  function clearSelection() {
    setSelected(null);
    setNameInput("");
    setFileInput("");
    setLookupError("");
  }

  function handleNameBlur() {
    if (!nameInput.trim()) return;
    const exactMatches = options.filter(
      (option) => normalize(option.full_name) === normalize(nameInput)
    );
    if (exactMatches.length === 1) {
      chooseEmployee(exactMatches[0]);
      return;
    }
    if (exactMatches.length > 1) {
      setSelected(null);
      setLookupError(
        "Multiple employees match that name. Please choose the correct employee from suggestions."
      );
      return;
    }
    if (!selected) {
      setLookupError("No employee found with that name.");
    }
  }

  function handleFileBlur() {
    if (!fileInput.trim()) return;
    const match = options.find(
      (option) => normalize(option.file_number ?? "") === normalize(fileInput)
    );
    if (match) {
      chooseEmployee(match);
      return;
    }
    setSelected(null);
    setLookupError("No employee found with that file number.");
  }

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 sm:p-6">
      <h2 className="text-lg font-semibold text-neutral-900">Employee Selection</h2>
      <p className="mt-1 text-sm text-neutral-600">
        Select an employee by name or file number to link this contract.
      </p>

      <input type="hidden" name="employee_id" value={selected?.id ?? ""} />

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="space-y-1.5">
          <span className="text-sm font-medium text-neutral-700">Employee Name</span>
          <input
            value={nameInput}
            onChange={(event) => {
              setNameInput(event.target.value);
              if (lookupError) setLookupError("");
              if (selected && normalize(event.target.value) !== normalize(selected.full_name)) {
                setSelected(null);
              }
            }}
            onBlur={handleNameBlur}
            placeholder="Search by employee name"
            className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-sm font-medium text-neutral-700">File Number</span>
          <input
            value={fileInput}
            onChange={(event) => {
              setFileInput(event.target.value);
              if (lookupError) setLookupError("");
              if (
                selected &&
                normalize(event.target.value) !== normalize(selected.file_number ?? "")
              ) {
                setSelected(null);
              }
            }}
            onBlur={handleFileBlur}
            placeholder="Search by file number"
            className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
          />
        </label>
      </div>

      <div className="mt-4">
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
          Suggestions
        </p>
        <div className="mt-2 grid gap-2">
          {suggestions.length === 0 ? (
            <p className="text-sm text-neutral-500">No matching employees.</p>
          ) : (
            suggestions.map((option) => (
              <button
                type="button"
                key={option.id}
                onClick={() => chooseEmployee(option)}
                className={`rounded-xl border px-3 py-2 text-left text-sm transition ${
                  selected?.id === option.id
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-50"
                }`}
              >
                <span className="font-medium">{option.full_name}</span>
                <span className="ml-2 text-xs opacity-80">
                  File #: {option.file_number ?? "—"}
                </span>
              </button>
            ))
          )}
        </div>
      </div>

      {lookupError ? (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {lookupError}
        </p>
      ) : null}

      {selected ? (
        <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
          <p className="text-sm font-semibold text-neutral-900">Selected Employee</p>
          <div className="mt-2 grid gap-1 text-sm text-neutral-700 sm:grid-cols-2">
            <p>
              <span className="font-medium">Name:</span> {selected.full_name}
            </p>
            <p>
              <span className="font-medium">File Number:</span> {selected.file_number ?? "—"}
            </p>
            <p>
              <span className="font-medium">Department:</span> {selected.department ?? "—"}
            </p>
            <p>
              <span className="font-medium">Job Title:</span> {selected.job_title ?? "—"}
            </p>
          </div>
          <label className="mt-3 block space-y-1.5">
            <span className="text-sm font-medium text-neutral-700">Contract Title</span>
            <input
              name="contract_title"
              readOnly
              value={selected.full_name}
              className="w-full rounded-xl border border-neutral-200 bg-neutral-100 px-3 py-2 text-sm text-neutral-700"
            />
          </label>
          <button
            type="button"
            onClick={clearSelection}
            className="mt-3 text-xs font-medium text-neutral-600 underline underline-offset-2 hover:text-neutral-900"
          >
            Clear selected employee
          </button>
        </div>
      ) : (
        <label className="mt-4 block space-y-1.5">
          <span className="text-sm font-medium text-neutral-700">Contract Title</span>
          <input
            name="contract_title"
            readOnly
            value=""
            placeholder="Auto-filled after selecting an employee"
            className="w-full rounded-xl border border-neutral-200 bg-neutral-100 px-3 py-2 text-sm text-neutral-500"
          />
        </label>
      )}
    </section>
  );
}
