import {
  ALERT_RULE_SEVERITIES,
  ALERT_RULE_SQL_GUIDANCE,
  alertRuleInputFromFormData,
  listAlertRules,
  updateAlertRule,
  type AlertRuleRecord,
} from "@/lib/queries/alert-rules";
import { revalidatePath } from "next/cache";
import PageHeader from "@/components/layout/page-header";
import { requireAnyPermission } from "@/lib/auth/guards";

function display(value: string | number | boolean | null): string {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (value === null || value === "") return "—";
  return String(value);
}

async function updateRuleAction(formData: FormData) {
  "use server";
  await requireAnyPermission(["alerts.rules.manage", "settings.manage", "admin.settings.manage"]);
  await updateAlertRule(alertRuleInputFromFormData(formData));
  revalidatePath("/admin/alert-rules");
  revalidatePath("/alerts/rules");
  revalidatePath("/alerts/active");
  revalidatePath("/dashboard");
}

export default async function AdminAlertRulesPage() {
  await requireAnyPermission(["alerts.rules.manage", "settings.manage", "admin.settings.manage"]);
  const rules = await listAlertRules();

  return (
    <main className="space-y-6">
      <PageHeader
        title="Alert Rules Settings"
        description="Configure alert timing, thresholds, severity, and automation status by module."
        backHref="/settings"
      />

      <RuleCards rules={rules} />

      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
        <h2 className="font-semibold">Database field guidance</h2>
        <p className="mt-1">
          The app reads rules defensively with optional fields allowed to be null. If a column is
          missing, add it when ready:
        </p>
        <pre className="mt-3 overflow-x-auto rounded-xl bg-white p-4 text-xs text-neutral-800">
          {ALERT_RULE_SQL_GUIDANCE.trim()}
        </pre>
      </section>
    </main>
  );
}

function RuleCards({ rules }: { rules: AlertRuleRecord[] }) {
  if (!rules.length) {
    return (
      <section className="rounded-2xl bg-white p-8 text-center text-sm text-neutral-600 shadow-sm ring-1 ring-neutral-200">
        No alert rules found.
      </section>
    );
  }

  return (
    <section className="grid gap-4 xl:grid-cols-2">
      {rules.map((rule) => (
        <article
          key={`${rule.id}-${rule.rule_code}`}
          className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-neutral-900">
                {rule.rule_name ?? "Untitled rule"}
              </h2>
              <p className="mt-1 text-sm text-neutral-600">
                {rule.description ?? "No description."}
              </p>
              {!rule.is_persisted ? (
                <p className="mt-3 rounded-xl bg-blue-50 px-3 py-2 text-xs text-blue-700">
                  Default rule shown until public.alert_rules is populated.
                </p>
              ) : null}
            </div>
            <span className="w-fit rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700">
              {display(rule.module_name)}
            </span>
          </div>

          <dl className="mt-4 grid gap-2 sm:grid-cols-3">
            <Meta label="Rule code" value={rule.rule_code} />
            <Meta label="Alert type" value={rule.alert_type} />
            <Meta label="Entity" value={rule.entity_type} />
          </dl>

          <RuleForm rule={rule} />
        </article>
      ))}
    </section>
  );
}

function Meta({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="rounded-xl bg-neutral-50 px-3 py-2">
      <dt className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">{label}</dt>
      <dd className="mt-1 truncate font-mono text-xs text-neutral-800" title={value ?? undefined}>
        {display(value)}
      </dd>
    </div>
  );
}

function RuleForm({ rule }: { rule: AlertRuleRecord }) {
  return (
    <form action={updateRuleAction} className="mt-5 space-y-4">
      <input type="hidden" name="id" value={rule.id} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="flex min-h-[66px] items-center gap-2 rounded-xl border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-700">
          <input name="is_active" type="checkbox" defaultChecked={rule.is_active !== false} />
          Active
        </label>
        <Field label="Threshold days" name="threshold_days" type="number" defaultValue={rule.threshold_days} />
        <Field label="Threshold value" name="threshold_value" type="number" step="0.01" defaultValue={rule.threshold_value} />
        <label className="text-xs font-medium text-neutral-600">
          Severity
          <select name="severity_level" defaultValue={rule.severity_level ?? "warning"} className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm">
            {ALERT_RULE_SEVERITIES.map((severity) => <option key={severity} value={severity}>{severity}</option>)}
          </select>
        </label>
        <Field label="Repeat interval" name="repeat_interval_days" type="number" defaultValue={rule.repeat_interval_days} />
        <Field label="Alert time" name="alert_time" type="time" defaultValue={(rule.alert_time ?? "").slice(0, 5)} />
        <label className="text-xs font-medium text-neutral-600 sm:col-span-2 lg:col-span-3">
          Applies to status
          <input name="applies_to_status" defaultValue={rule.applies_to_status ?? ""} placeholder="active, pending, missing" className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm" />
        </label>
      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!rule.is_persisted}
          className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
        >
          Save Rule
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  type,
  step,
  defaultValue,
}: {
  label: string;
  name: string;
  type: "number" | "time";
  step?: string;
  defaultValue: string | number | null;
}) {
  return (
    <label className="text-xs font-medium text-neutral-600">
      {label}
      <input
        name={name}
        type={type}
        min={type === "number" ? "0" : undefined}
        step={step}
        defaultValue={defaultValue ?? ""}
        className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
      />
    </label>
  );
}
