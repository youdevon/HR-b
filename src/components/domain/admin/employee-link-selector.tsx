"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { formHelperClass, formInputClass } from "@/lib/ui/form-styles";
import { FormLabel } from "@/components/ui/form-primitives";

export type EmployeeLinkOption = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  file_number: string | null;
  department: string | null;
  job_title: string | null;
};

type EmployeeLinkSelectorProps = {
  employees: EmployeeLinkOption[];
  selectedEmployeeId?: string | null;
  isOfficerRole?: boolean;
};

function employeeLabel(emp: EmployeeLinkOption): string {
  const name = [emp.first_name, emp.last_name].filter(Boolean).join(" ") || "Unnamed";
  return emp.file_number ? `${name} (${emp.file_number})` : name;
}

export default function EmployeeLinkSelector({
  employees,
  selectedEmployeeId,
  isOfficerRole = false,
}: EmployeeLinkSelectorProps) {
  const [selectedId, setSelectedId] = useState<string | null>(selectedEmployeeId ?? null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedEmployee = useMemo(
    () => employees.find((emp) => emp.id === selectedId) ?? null,
    [employees, selectedId]
  );

  const filteredOptions = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return employees;
    return employees.filter((emp) => {
      const fullName = `${emp.first_name ?? ""} ${emp.last_name ?? ""}`.toLowerCase();
      const fileNumber = (emp.file_number ?? "").toLowerCase();
      return fullName.includes(term) || fileNumber.includes(term);
    });
  }, [employees, searchTerm]);

  const handleSelect = useCallback((emp: EmployeeLinkOption) => {
    setSelectedId(emp.id);
    setSearchTerm("");
    setIsOpen(false);
  }, []);

  const handleClear = useCallback(() => {
    setSelectedId(null);
    setSearchTerm("");
  }, []);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLDivElement>) => {
    if (!containerRef.current?.contains(e.relatedTarget)) {
      setIsOpen(false);
    }
  }, []);

  return (
    <div className="col-span-full space-y-2" ref={containerRef} onBlur={handleBlur}>
      <FormLabel>Linked Employee Record</FormLabel>

      <input type="hidden" name="employee_id" value={selectedId ?? ""} />

      {selectedEmployee ? (
        <div className="flex items-start justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-3">
          <div className="grid gap-1 text-sm">
            <p className="font-semibold text-neutral-900">{employeeLabel(selectedEmployee)}</p>
            <p className="text-neutral-600">
              {[selectedEmployee.department, selectedEmployee.job_title].filter(Boolean).join(" — ") || "—"}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="ml-3 shrink-0 rounded-lg border border-neutral-300 bg-white px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Change
          </button>
        </div>
      ) : (
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder="Search by employee name or file number..."
            className={formInputClass}
            autoComplete="off"
          />

          {isOpen && (
            <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-neutral-200 bg-white shadow-lg">
              {filteredOptions.length === 0 ? (
                <li className="px-3 py-2 text-sm text-neutral-500">No employees found.</li>
              ) : (
                filteredOptions.slice(0, 50).map((emp) => (
                  <li key={emp.id}>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleSelect(emp)}
                      className="flex w-full flex-col px-3 py-2 text-left hover:bg-neutral-50"
                    >
                      <span className="text-sm font-medium text-neutral-900">{employeeLabel(emp)}</span>
                      <span className="text-xs text-neutral-500">
                        {[emp.department, emp.job_title].filter(Boolean).join(" — ") || "—"}
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
      )}

      {isOfficerRole && !selectedId ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Officer accounts should be linked to an employee record so their profile page can display correctly.
        </p>
      ) : (
        <p className={formHelperClass}>
          Optional. Link this user account to an employee record for self-service profile access.
        </p>
      )}
    </div>
  );
}
