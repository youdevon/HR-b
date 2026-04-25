"use client";

import { useMemo, useState } from "react";
import type { AdminPermissionRecord } from "@/lib/queries/admin";

const ACTIVE_MODULE_ORDER = [
  "Dashboard",
  "Employees",
  "Contracts",
  "Leave",
  "Physical Files",
  "Records",
  "Alerts",
  "Reports",
  "Audit",
  "Gratuity",
  "Admin Users",
  "Admin Roles",
  "Admin Permissions",
  "Administration",
  "Settings",
] as const;

const INACTIVE_MODULE_ORDER = ["Documents", "Compensation"] as const;

type RolePermissionsFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  submitLabel: string;
  permissions: AdminPermissionRecord[];
  assignedPermissionIds?: string[];
  defaultValues?: {
    role_name?: string | null;
    role_code?: string | null;
    description?: string | null;
    is_active?: boolean | null;
  };
  showSystemRoleNotice?: boolean;
};

function clean(value?: string | null): string {
  return value?.trim() ?? "";
}

function normalizeRoleCode(value: string): string {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase();
}

function titleCase(value: string): string {
  return value
    .split(" ")
    .filter(Boolean)
    .map((part) => `${part[0]?.toUpperCase() ?? ""}${part.slice(1).toLowerCase()}`)
    .join(" ");
}

function canonicalModuleName(moduleName: string): string {
  const normalized = moduleName.trim().toLowerCase();
  if (normalized === "physical_files") return "Physical Files";
  if (normalized === "admin users") return "Admin Users";
  if (normalized === "admin roles") return "Admin Roles";
  if (normalized === "admin permissions") return "Admin Permissions";
  const match = ACTIVE_MODULE_ORDER.find((entry) => entry.toLowerCase() === normalized);
  if (match) return match;
  const inactive = INACTIVE_MODULE_ORDER.find((entry) => entry.toLowerCase() === normalized);
  if (inactive) return inactive;
  return titleCase(moduleName);
}

export default function RolePermissionsForm({
  action,
  submitLabel,
  permissions,
  assignedPermissionIds = [],
  defaultValues,
  showSystemRoleNotice = false,
}: RolePermissionsFormProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(assignedPermissionIds));
  const [showInactivePermissions, setShowInactivePermissions] = useState(false);
  const grouped = useMemo(() => {
    const activeGroupedMap = new Map<string, AdminPermissionRecord[]>();
    const inactiveGroupedMap = new Map<string, AdminPermissionRecord[]>();

    for (const permission of permissions) {
      const moduleName = canonicalModuleName(clean(permission.module_name) || "General");
      const normalizedModule = moduleName.toLowerCase();
      const isInactiveModule = INACTIVE_MODULE_ORDER.some(
        (entry) => entry.toLowerCase() === normalizedModule
      );

      if (isInactiveModule) {
        const list = inactiveGroupedMap.get(moduleName) ?? [];
        list.push(permission);
        inactiveGroupedMap.set(moduleName, list);
        continue;
      }

      if (!ACTIVE_MODULE_ORDER.some((entry) => entry.toLowerCase() === normalizedModule)) {
        continue;
      }

      if (permission.is_active === false) continue;
      const list = activeGroupedMap.get(moduleName) ?? [];
      list.push(permission);
      activeGroupedMap.set(moduleName, list);
    }

    for (const [moduleName, list] of activeGroupedMap) {
      activeGroupedMap.set(
        moduleName,
        [...list].sort((a, b) =>
          clean(a.permission_name || a.permission_key).localeCompare(
            clean(b.permission_name || b.permission_key)
          )
        )
      );
    }

    for (const [moduleName, list] of inactiveGroupedMap) {
      inactiveGroupedMap.set(
        moduleName,
        [...list].sort((a, b) =>
          clean(a.permission_name || a.permission_key).localeCompare(
            clean(b.permission_name || b.permission_key)
          )
        )
      );
    }

    const active = ACTIVE_MODULE_ORDER.map((moduleName) => ({
      moduleName,
      permissions: activeGroupedMap.get(moduleName) ?? [],
    })).filter((entry) => entry.permissions.length > 0);

    const inactive = INACTIVE_MODULE_ORDER.map((moduleName) => ({
      moduleName,
      permissions: inactiveGroupedMap.get(moduleName) ?? [],
    })).filter((entry) => entry.permissions.length > 0);

    return { active, inactive };
  }, [permissions]);

  const allPermissionIds = useMemo(
    () => grouped.active.flatMap((group) => group.permissions.map((permission) => permission.id)),
    [grouped]
  );

  const togglePermission = (permissionId: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(permissionId);
      else next.delete(permissionId);
      return next;
    });
  };

  const selectModule = (permissionIds: string[]) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const permissionId of permissionIds) next.add(permissionId);
      return next;
    });
  };

  const clearModule = (permissionIds: string[]) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const permissionId of permissionIds) next.delete(permissionId);
      return next;
    });
  };

  return (
    <form action={action} className="space-y-6">
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Role Name" name="role_name" defaultValue={defaultValues?.role_name ?? ""} required />
          <Field
            label="Role Code"
            name="role_code"
            defaultValue={defaultValues?.role_code ?? ""}
            placeholder="HR_MANAGER"
            required
            normalizeOnBlur
          />
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium text-neutral-700">Description</span>
            <textarea
              name="description"
              rows={3}
              defaultValue={defaultValues?.description ?? ""}
              className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-neutral-700">Active</span>
            <select
              name="is_active"
              defaultValue={defaultValues?.is_active === false ? "false" : "true"}
              className="h-10 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm"
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </label>
          {showSystemRoleNotice ? (
            <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
              This is a system role. Deletion is protected.
            </p>
          ) : null}
        </div>
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-neutral-900">Permissions</h2>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedIds(new Set(allPermissionIds))}
              className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700"
            >
              Select all active permissions
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700"
            >
              Clear all permissions
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {grouped.active.map((group) => {
            const ids = group.permissions.map((permission) => permission.id);
            return (
              <article key={group.moduleName} className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-neutral-900">{group.moduleName}</h3>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => selectModule(ids)}
                      className="rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-700"
                    >
                      Select all
                    </button>
                    <button
                      type="button"
                      onClick={() => clearModule(ids)}
                      className="rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-700"
                    >
                      Clear all
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {group.permissions.map((permission) => {
                    const checked = selectedIds.has(permission.id);
                    return (
                      <label
                        key={permission.id}
                        className="flex gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          name="permission_ids"
                          value={permission.id}
                          checked={checked}
                          onChange={(event) => togglePermission(permission.id, event.target.checked)}
                          className="mt-0.5"
                        />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-neutral-900">
                            {permission.permission_name ?? permission.permission_key ?? "Permission"}
                          </span>
                          <span className="block truncate font-mono text-xs text-neutral-500">
                            {permission.permission_key ?? "—"}
                          </span>
                        </span>
                        {permission.is_sensitive ? (
                          <span className="ml-auto h-fit rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800">
                            Sensitive
                          </span>
                        ) : null}
                      </label>
                    );
                  })}
                </div>
              </article>
            );
          })}
        </div>

        {grouped.inactive.length ? (
          <div className="mt-6 space-y-3 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-neutral-700">
                Inactive / Not Currently Used
              </h3>
              <label className="flex items-center gap-2 text-xs text-neutral-600">
                <input
                  type="checkbox"
                  checked={showInactivePermissions}
                  onChange={(event) => setShowInactivePermissions(event.target.checked)}
                />
                Show inactive permissions
              </label>
            </div>
            <div className="grid gap-3 lg:grid-cols-2">
              {grouped.inactive.map((group) => (
                <article
                  key={group.moduleName}
                  className="rounded-xl border border-neutral-200 bg-neutral-100 p-3 opacity-80"
                >
                  <h4 className="mb-2 text-sm font-semibold text-neutral-700">{group.moduleName}</h4>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {group.permissions.map((permission) => {
                      const checked = selectedIds.has(permission.id);
                      const disabled = !showInactivePermissions;
                      return (
                        <label
                          key={permission.id}
                          className="flex gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm"
                        >
                          <input
                            type="checkbox"
                            name="permission_ids"
                            value={permission.id}
                            checked={checked}
                            disabled={disabled}
                            onChange={(event) =>
                              togglePermission(permission.id, event.target.checked)
                            }
                            className="mt-0.5"
                          />
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium text-neutral-700">
                              {permission.permission_name ?? permission.permission_key ?? "Permission"}
                            </span>
                            <span className="block truncate font-mono text-xs text-neutral-500">
                              {permission.permission_key ?? "—"}
                            </span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-200">
        <button
          type="submit"
          className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
        >
          {submitLabel}
        </button>
      </section>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  required,
  placeholder,
  normalizeOnBlur = false,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
  placeholder?: string;
  normalizeOnBlur?: boolean;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium text-neutral-700">{label}</span>
      <input
        name={name}
        required={required}
        defaultValue={defaultValue}
        placeholder={placeholder}
        onBlur={
          normalizeOnBlur
            ? (event) => {
                event.currentTarget.value = normalizeRoleCode(event.currentTarget.value);
              }
            : undefined
        }
        className="h-10 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm"
      />
    </label>
  );
}
