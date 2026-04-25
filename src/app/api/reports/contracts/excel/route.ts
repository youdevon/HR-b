import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { calculateContractMonths, calculateGratuityPayment } from "@/lib/queries/gratuity";
import {
  CONTRACT_REPORT_DEFAULT_FIELDS,
  CONTRACT_REPORT_FIELD_OPTIONS,
  getContractsReport,
  normalizeContractReportFields,
  type ReportFilters,
} from "@/lib/queries/reports";

function clean(value?: string): string {
  return value?.trim() ?? "";
}

function getFilters(searchParams: URLSearchParams): ReportFilters {
  const fieldsParam = searchParams.getAll("fields");
  return {
    show: searchParams.get("show") ?? "",
    query: searchParams.get("query") ?? searchParams.get("q") ?? "",
    reportType: searchParams.get("reportType") ?? "",
    contractStatus: searchParams.get("contractStatus") ?? "",
    expiringRange: searchParams.get("expiringRange") ?? "",
    contractType: searchParams.get("contractType") ?? "",
    department: searchParams.get("department") ?? "",
    startDate: searchParams.get("startDate") ?? "",
    endDate: searchParams.get("endDate") ?? "",
    hasAllowances: searchParams.get("hasAllowances") ?? "",
    allowanceName: searchParams.get("allowanceName") ?? "",
    fields:
      fieldsParam.length > 0 ? fieldsParam.filter(Boolean).join(",") : searchParams.get("fields") ?? "",
  };
}

function hasCriteria(filters: ReportFilters): boolean {
  return Boolean(
    clean(filters.show).toLowerCase() === "all" ||
      clean(filters.query) ||
      clean(filters.contractStatus) ||
      clean(filters.expiringRange) ||
      clean(filters.contractType) ||
      clean(filters.department) ||
      clean(filters.startDate) ||
      clean(filters.endDate) ||
      clean(filters.reportType) ||
      clean(filters.hasAllowances) ||
      clean(filters.allowanceName)
  );
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString();
}

function formatType(value: string | null): string {
  if (value === "fixed_term") return "Fixed Term";
  if (value === "temporary") return "Short Term";
  return value ? value.replaceAll("_", " ") : "—";
}

function formatStatus(value: string | null): string {
  if (!value) return "—";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function filterSummary(filters: ReportFilters): string {
  const items: string[] = [];
  if (clean(filters.show).toLowerCase() === "all") items.push("Show: all");
  if (clean(filters.query)) items.push(`Search: ${filters.query}`);
  if (clean(filters.contractStatus)) items.push(`Contract Status: ${filters.contractStatus}`);
  if (clean(filters.expiringRange)) items.push(`Expiring Range: ${filters.expiringRange} days`);
  if (clean(filters.contractType)) {
    items.push(
      `Contract Type: ${
        filters.contractType === "fixed_term"
          ? "Fixed Term"
          : filters.contractType === "temporary"
            ? "Short Term"
            : filters.contractType
      }`
    );
  }
  if (clean(filters.hasAllowances).toLowerCase() === "true") items.push("Has Allowances: Yes");
  if (clean(filters.allowanceName)) items.push(`Allowance Type/Name: ${filters.allowanceName}`);
  return items.length ? items.join(" | ") : "No filters";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filters = getFilters(searchParams);
  if (!hasCriteria(filters)) {
    return NextResponse.json(
      { error: "Use Show All or apply filters before exporting." },
      { status: 400 }
    );
  }

  const rows = await getContractsReport(filters);
  const selectedFields = normalizeContractReportFields(filters.fields);
  const fields = selectedFields.length ? selectedFields : CONTRACT_REPORT_DEFAULT_FIELDS;
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Contracts Report");
  const now = new Date();

  const widthByField: Record<string, number> = {
    contract_number: 20,
    employee_name: 28,
    file_number: 14,
    contract_type: 16,
    contract_status: 26,
    start_date: 16,
    end_date: 16,
    monthly_salary: 16,
    gratuity_eligibility: 20,
    estimated_gratuity: 18,
    allowance_names: 34,
    allowance_details: 45,
    total_monthly_allowances: 24,
    monthly_salary_plus_allowances: 26,
  };
  sheet.columns = fields.map((field) => ({
    header: CONTRACT_REPORT_FIELD_OPTIONS.find((option) => option.key === field)?.label ?? field,
    key: field,
    width: widthByField[field] ?? 18,
  }));

  const endColumnLetter = String.fromCharCode("A".charCodeAt(0) + Math.max(0, fields.length - 1));
  sheet.mergeCells(`A1:${endColumnLetter}1`);
  sheet.getCell("A1").value = "Contracts Report";
  sheet.getCell("A1").font = { bold: true, size: 15 };
  sheet.getCell("A2").value = `Generated: ${now.toLocaleString()}`;
  sheet.getCell("A3").value = `Filters: ${filterSummary(filters)}`;

  const headerRow = sheet.addRow(
    fields.map((field) => CONTRACT_REPORT_FIELD_OPTIONS.find((option) => option.key === field)?.label ?? field)
  );
  headerRow.font = { bold: true };

  for (const row of rows) {
    const months = calculateContractMonths(row.start_date, row.end_date);
    const estimated =
      row.is_gratuity_eligible && row.salary_amount !== null && months > 0
        ? calculateGratuityPayment({
            monthlySalary: row.salary_amount,
            contractMonths: months,
            isGratuityEligible: true,
          }).net_gratuity_payable
        : null;
    sheet.addRow(
      fields.map((field) => {
        if (field === "contract_number") return row.contract_number ?? "—";
        if (field === "employee_name") return row.employee_name ?? "—";
        if (field === "file_number") return row.employee_number ?? "—";
        if (field === "contract_type") return formatType(row.contract_type);
        if (field === "contract_status") return `${formatStatus(row.contract_status)} / ${formatStatus(row.effective_contract_status)}`;
        if (field === "start_date") return formatDate(row.start_date);
        if (field === "end_date") return formatDate(row.end_date);
        if (field === "monthly_salary") return row.salary_amount;
        if (field === "gratuity_eligibility") return row.is_gratuity_eligible ? "Eligible" : "Not applicable";
        if (field === "estimated_gratuity") return estimated;
        if (field === "allowance_names") return row.allowance_names ?? "—";
        if (field === "allowance_details") return row.allowance_details ?? "—";
        if (field === "total_monthly_allowances") return row.total_monthly_allowances ?? "—";
        return row.monthly_salary_plus_allowances ?? "—";
      })
    );
  }

  fields.forEach((field, index) => {
    if (
      field === "monthly_salary" ||
      field === "estimated_gratuity" ||
      field === "total_monthly_allowances" ||
      field === "monthly_salary_plus_allowances"
    ) {
      sheet.getColumn(index + 1).numFmt = "$#,##0.00";
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return new NextResponse(buffer as BodyInit, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="contracts-report-${now
        .toISOString()
        .slice(0, 10)}.xlsx"`,
    },
  });
}
