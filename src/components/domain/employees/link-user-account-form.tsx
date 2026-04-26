"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  formCheckboxClass,
  formDangerButtonClass,
  formInputClass,
  formPrimaryButtonClass,
} from "@/lib/ui/form-styles";
import { cn } from "@/lib/utils/cn";

export type UserAccountOption = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  role_name: string | null;
  role_code: string | null;
  account_status: string | null;
  employee_id: string | null;
};

type LinkUserAccountFormProps = {
  employeeId: string;
  employeeAlreadyLinked: boolean;
  users: UserAccountOption[];
  linkAction: (formData: FormData) => void | Promise<void>;
};

function userName(u: UserAccountOption): string {
  return [u.first_name, u.last_name].filter(Boolean).join(" ") || "Unnamed";
}

export default function LinkUserAccountForm({
  employeeId,
  employeeAlreadyLinked,
  users,
  linkAction,
}: LinkUserAccountFormProps) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedUser = useMemo(
    () => users.find((u) => u.id === selectedUserId) ?? null,
    [users, selectedUserId]
  );

  const alreadyLinkedElsewhere =
    selectedUser?.employee_id != null &&
    selectedUser.employee_id !== employeeId;

  const filteredUsers = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return users;
    return users.filter((u) => {
      const name = `${u.first_name ?? ""} ${u.last_name ?? ""}`.toLowerCase();
      const email = (u.email ?? "").toLowerCase();
      const role = (u.role_name ?? "").toLowerCase();
      return name.includes(term) || email.includes(term) || role.includes(term);
    });
  }, [users, searchTerm]);

  const handleSelect = useCallback((u: UserAccountOption) => {
    setSelectedUserId(u.id);
    setSearchTerm("");
    setIsOpen(false);
  }, []);

  const handleClear = useCallback(() => {
    setSelectedUserId(null);
    setSearchTerm("");
  }, []);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLDivElement>) => {
    if (!containerRef.current?.contains(e.relatedTarget)) {
      setIsOpen(false);
    }
  }, []);

  const canSubmit = selectedUserId && !alreadyLinkedElsewhere && !employeeAlreadyLinked;

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold text-neutral-900">Link a User Account</h2>
      <p className="mt-1 text-sm text-neutral-600">
        Search for a user account to link to this employee record.
      </p>

      {employeeAlreadyLinked ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <p className="font-medium">This employee is already linked to a user account.</p>
          <p className="mt-1">Unlink the existing account before linking another one.</p>
        </div>
      ) : (
      <div className="mt-4 space-y-4" ref={containerRef} onBlur={handleBlur}>
        {selectedUser ? (
          <div className="space-y-3">
            <div className="flex items-start justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="space-y-1 text-sm">
                <p className="font-semibold text-neutral-900">{userName(selectedUser)}</p>
                <p className="text-neutral-600">{selectedUser.email ?? "—"}</p>
                <p className="text-neutral-600">
                  Role: {selectedUser.role_name ?? selectedUser.role_code ?? "—"} · Status: {selectedUser.account_status ?? "—"}
                </p>
                {alreadyLinkedElsewhere ? (
                  <p className="font-medium text-amber-700">
                    Currently linked to another employee.
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={handleClear}
                className="ml-3 shrink-0 rounded-lg border border-neutral-300 bg-white px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
              >
                Change
              </button>
            </div>

            {alreadyLinkedElsewhere ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-medium text-amber-800">
                  This user account is already linked to another employee. Unlink it first before linking it here.
                </p>
              </div>
            ) : null}

            <form action={linkAction}>
              <input type="hidden" name="user_id" value={selectedUserId ?? ""} />
              <input type="hidden" name="employee_id" value={employeeId} />
              <button
                type="submit"
                disabled={!canSubmit}
                className={formPrimaryButtonClass}
              >
                Link User Account
              </button>
            </form>
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
              placeholder="Search by name, email, or role..."
              className={formInputClass}
              autoComplete="off"
            />
            {isOpen && (
              <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-neutral-200 bg-white shadow-lg">
                {filteredUsers.length === 0 ? (
                  <li className="px-3 py-2 text-sm text-neutral-500">No user accounts found.</li>
                ) : (
                  filteredUsers.slice(0, 50).map((u) => (
                    <li key={u.id}>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleSelect(u)}
                        className="flex w-full flex-col px-3 py-2 text-left hover:bg-neutral-50"
                      >
                        <span className="text-sm font-medium text-neutral-900">
                          {userName(u)} {u.email ? `— ${u.email}` : ""}
                        </span>
                        <span className="text-xs text-neutral-500">
                          {u.role_name ?? u.role_code ?? "No role"} · {u.account_status ?? "—"}
                          {u.employee_id ? " · Already linked" : ""}
                        </span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>
        )}
      </div>
      )}
    </section>
  );
}

type UnlinkUserSectionProps = {
  linkedUser: UserAccountOption;
  unlinkAction: (formData: FormData) => void | Promise<void>;
};

export function UnlinkUserSection({ linkedUser, unlinkAction }: UnlinkUserSectionProps) {
  const [confirmed, setConfirmed] = useState(false);

  return (
    <section className="rounded-2xl border border-red-300 bg-red-50 p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-red-800">Currently Linked User Account</h2>
      <div className="mt-3 rounded-xl border border-neutral-200 bg-white p-4 text-sm">
        <p className="font-semibold text-neutral-900">{userName(linkedUser)}</p>
        <p className="text-neutral-600">{linkedUser.email ?? "—"}</p>
        <p className="text-neutral-600">
          Role: {linkedUser.role_name ?? linkedUser.role_code ?? "—"} · Status: {linkedUser.account_status ?? "—"}
        </p>
      </div>

      <div className="mt-4 space-y-3">
        <p className="text-sm text-red-700">
          Unlinking will remove the connection between this employee and the user account. The user account will not be deleted.
        </p>
        <form action={unlinkAction} className="space-y-3">
          <input type="hidden" name="user_id" value={linkedUser.id} />
          <label className="flex items-start gap-2 text-sm font-medium text-red-800">
            <input
              type="checkbox"
              name="confirm_unlink"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className={cn(formCheckboxClass, "mt-0.5 border-red-400 text-red-700")}
            />
            <span>I understand this will remove the connection between this employee and the user account.</span>
          </label>
          <button
            type="submit"
            disabled={!confirmed}
            className={formDangerButtonClass}
          >
            Unlink User Account
          </button>
        </form>
      </div>
    </section>
  );
}
