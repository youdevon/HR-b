import Link from "next/link";
import PageHeader from "@/components/layout/page-header";
import {
  ALERT_RULE_SQL_GUIDANCE,
  listAlertRules,
  type AlertRuleRecord,
} from "@/lib/queries/alert-rules";

function display(value: string | number | boolean | null | undefined): string {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

export default async function AlertRulesPage() {
  const rules = await listAlertRules();

  return (
    <main className="space-y-6">
      <PageHeader
        title="Alert Rules"
        description="Review automation rules used by system notification generation."
        backHref="/alerts/active"
        actions={
          <Link
            href="/admin/alert-rules"
            className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-900 transition hover:bg-neutral-50"
          >
            Admin Settings
          </Link>
        }
      />

      <RulesList rules={rules} />

      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
        <h2 className="font-semibold">Database field guidance</h2>
        <p className="mt-1">Optional rule fields can be null. Add missing fields when ready:</p>
        <pre className="mt-3 overflow-x-auto rounded-xl bg-white p-4 text-xs text-neutral-800">
          {ALERT_RULE_SQL_GUIDANCE.trim()}
        </pre>
      </section>
    </main>
  );
}

function RulesList({ rules }: { rules: AlertRuleRecord[] }) {
  if (!rules.length) {
    return (
      <section className="rounded-2xl bg-white p-8 text-center text-sm text-neutral-600 shadow-sm ring-1 ring-neutral-200">
        No alert rules found.
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-neutral-200 text-sm">
          <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-600">
            <tr>
              <th className="px-4 py-3">Rule</th>
              <th className="px-4 py-3">Module</th>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Alert Type</th>
              <th className="px-4 py-3">Entity</th>
              <th className="px-4 py-3">Thresholds</th>
              <th className="px-4 py-3">Severity</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {rules.map((rule) => (
              <tr key={`${rule.id}-${rule.rule_code}`} className="align-top hover:bg-neutral-50">
                <td className="max-w-xs px-4 py-4">
                  <p className="font-medium text-neutral-900">{rule.rule_name ?? "Untitled rule"}</p>
                  <p className="mt-1 text-xs text-neutral-500">{rule.description ?? "No description."}</p>
                  {!rule.is_persisted ? (
                    <p className="mt-2 rounded-lg bg-blue-50 px-2 py-1 text-xs text-blue-700">
                      Default rule shown until public.alert_rules is populated.
                    </p>
                  ) : null}
                </td>
                <td className="px-4 py-4">{display(rule.module_name)}</td>
                <td className="px-4 py-4 font-mono text-xs">{display(rule.rule_code)}</td>
                <td className="px-4 py-4 font-mono text-xs">{display(rule.alert_type)}</td>
                <td className="px-4 py-4">{display(rule.entity_type)}</td>
                <td className="px-4 py-4">
                  <div className="space-y-1 text-xs text-neutral-600">
                    <p>Days: {display(rule.threshold_days)}</p>
                    <p>Value: {display(rule.threshold_value)}</p>
                    <p>Repeat: {display(rule.repeat_interval_days)}</p>
                    <p>Time: {display(rule.alert_time)}</p>
                    <p>Applies to: {display(rule.applies_to_status)}</p>
                  </div>
                </td>
                <td className="px-4 py-4">{display(rule.severity_level)}</td>
                <td className="px-4 py-4">{display(rule.is_active)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
