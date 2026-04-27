"use client";

import { usePathname } from "next/navigation";
import BackLink from "@/components/navigation/back-link";

const exactBackHrefs: Record<string, string | null> = {
  "/dashboard": null,
  "/employees": "/dashboard",
  "/contracts": "/dashboard",
  "/leave": "/dashboard",
  "/file-movements": "/dashboard",
  "/records": "/dashboard",
  "/reports": "/dashboard",
  "/alerts/active": "/dashboard",
  "/admin": "/dashboard",
  "/admin/users": "/dashboard",
  "/admin/roles": "/dashboard",
  "/admin/permissions": "/dashboard",
  "/audit/activity": "/dashboard",
  "/gratuity/calculations": "/settings",
  "/employees/new": "/employees",
  "/contracts/new": "/contracts",
  "/contracts/expiring": "/contracts",
  "/contracts/expired": "/contracts",
  "/contracts/renewals": "/contracts",
  "/leave/new": "/leave",
  "/leave/balances": "/leave",
  "/leave/transactions": "/leave",
  "/leave/low-sick": "/leave",
  "/leave/low-vacation": "/leave",
  "/file-movements/new": "/file-movements",
  "/files/movements": "/file-movements",
  "/files/movements/new": "/file-movements",
  "/files/in-transit": "/file-movements",
  "/files/missing": "/file-movements",
  "/records/new": "/records",
  "/alerts/resolved": "/alerts/active",
  "/alerts/rules": "/alerts/active",
  "/admin/users/new": "/admin/users",
  "/admin/roles/new": "/admin/roles",
  "/admin/alert-rules": "/admin/permissions",
  "/admin/document-types": "/admin",
  "/admin/custom-fields": "/admin",
  "/admin/settings": "/admin",
  "/settings/gratuity-rules": "/settings",
  "/gratuity/payments": "/settings/gratuity-rules",
  "/gratuity/rules": "/settings/gratuity-rules",
  "/gratuity/pending-review": "/settings/gratuity-rules",
  "/gratuity/approved-unpaid": "/settings/gratuity-rules",
  "/audit/sensitive": "/audit/activity",
  "/profile/change-password": "/dashboard",
};

function parentFromPath(pathname: string): string | null {
  if (pathname in exactBackHrefs) {
    return exactBackHrefs[pathname] ?? null;
  }

  const segments = pathname.split("/").filter(Boolean);

  if (segments[0] === "employees" && segments.length === 2) {
    return "/employees";
  }
  if (segments[0] === "employees" && segments.length === 3 && segments[2] === "edit") {
    return `/employees/${segments[1]}`;
  }

  if (segments[0] === "contracts" && segments.length === 2) {
    return "/contracts";
  }
  if (segments[0] === "contracts" && segments.length === 3 && segments[2] === "edit") {
    return `/contracts/${segments[1]}`;
  }

  if (segments[0] === "leave" && segments.length === 2) {
    return "/leave";
  }
  if (segments[0] === "leave" && segments.length === 3 && segments[2] === "edit") {
    return `/leave/${segments[1]}`;
  }

  if (segments[0] === "file-movements" && segments.length === 2) {
    return "/file-movements";
  }

  if (segments[0] === "records" && segments.length === 2) {
    return "/records";
  }
  if (segments[0] === "records" && segments.length === 3 && segments[2] === "edit") {
    return `/records/${segments[1]}`;
  }

  if (segments[0] === "alerts" && segments.length === 2) {
    return "/alerts/active";
  }

  if (segments[0] === "admin" && segments[1] === "users" && segments.length === 4 && segments[3] === "edit") {
    return "/admin/users";
  }
  if (segments[0] === "admin" && segments[1] === "roles" && segments.length === 4 && segments[3] === "edit") {
    return "/admin/roles";
  }

  if (segments[0] === "reports" && segments.length === 2) {
    return "/reports";
  }
  if (segments[0] === "audit" && segments.length === 2) {
    return "/audit/activity";
  }
  if (segments[0] === "gratuity" && segments.length === 2) {
    return "/settings/gratuity-rules";
  }
  if (segments[0] === "files" && segments.length === 2) {
    return "/file-movements";
  }

  return "/dashboard";
}

export default function BackNav() {
  const pathname = usePathname();
  const href = parentFromPath(pathname);

  if (!href) {
    return null;
  }

  return (
    <div className="mb-4 flex items-center">
      <BackLink href={href} />
    </div>
  );
}
