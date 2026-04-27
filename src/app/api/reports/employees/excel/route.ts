import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { hasPermission } from "@/lib/auth/permissions";
import {
  EMPLOYEE_REPORT_FIELD_OPTIONS,
  getContractAvailabilityFilterSummary,
  getContractAvailabilityMode,
  getEmployeeReport,
  type EmployeeReportFieldKey,
  type EmployeeReportFilters,
} from "@/lib/queries/reports";

function getFilters(searchParams: URLSearchParams): EmployeeReportFilters {
  const fieldsParam = searchParams.getAll("fields");
  return {
    show: searchParams.get("show") ?? "",
    name: searchParams.get("name") ?? "",
    fileNumber: searchParams.get("fileNumber") ?? "",
    minAge: searchParams.get("minAge") ?? "",
    maxAge: searchParams.get("maxAge") ?? "",
    department: searchParams.get("department") ?? "",
    jobTitle: searchParams.get("jobTitle") ?? "",
    status: searchParams.get("status") ?? "",
    hasContracts: searchParams.get("hasContracts") ?? "",
    noContracts: searchParams.get("noContracts") ?? "",
    fiscalCutoffYear: searchParams.get("fiscalCutoffYear") ?? "",
    fiscalCutoffMonth: searchParams.get("fiscalCutoffMonth") ?? "",
    hasAllowances: searchParams.get("hasAllowances") ?? "",
    allowanceName: searchParams.get("allowanceName") ?? "",
    fields:
      fieldsParam.length > 0
        ? fieldsParam.join(",")
        : searchParams.get("fields") ?? "",
  };
}

function calculateFiscalCutoffDate(yearText?: string, monthText?: string): string | null {
  const year = Number((yearText ?? "").trim());
  const month = Number((monthText ?? "").trim());
  if (!Number.isInteger(year) || year < 1900) return null;
  if (!Number.isInteger(month) || month < 1 || month > 12) return null;
  const lastDay = new Date(year, month, 0).getDate();
  return `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
}

function formatCutoffDate(value: string): string {
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function filterSummary(filters: EmployeeReportFilters): string {
  const items: string[] = [];
  const { restrictToNoContractsOnly } = getContractAvailabilityMode(filters);
  if ((filters.show ?? "").trim().toLowerCase() === "all") items.push("Show: all");
  if ((filters.name ?? "").trim()) items.push(`Name: ${filters.name}`);
  if ((filters.fileNumber ?? "").trim()) items.push(`File Number: ${filters.fileNumber}`);
  if ((filters.minAge ?? "").trim()) items.push(`Minimum Age: ${filters.minAge}`);
  if ((filters.maxAge ?? "").trim()) items.push(`Maximum Age: ${filters.maxAge}`);
  if ((filters.department ?? "").trim()) items.push(`Department: ${filters.department}`);
  if ((filters.jobTitle ?? "").trim()) items.push(`Job Title: ${filters.jobTitle}`);
  if ((filters.status ?? "").trim() && !restrictToNoContractsOnly) {
    items.push(`Status: ${filters.status}`);
  }
  const contractAvail = getContractAvailabilityFilterSummary(filters);
  if (contractAvail) items.push(contractAvail);
  const cutoff = calculateFiscalCutoffDate(filters.fiscalCutoffYear, filters.fiscalCutoffMonth);
  if (cutoff && !restrictToNoContractsOnly) {
    items.push(`Fiscal Year Cut-Off: ${formatCutoffDate(cutoff)}`);
  }
  if ((filters.hasAllowances ?? "").trim().toLowerCase() === "true") {
    items.push("Has Allowances: Yes");
  }
  if ((filters.allowanceName ?? "").trim()) {
    items.push(`Allowance Type/Name: ${filters.allowanceName}`);
  }
  return items.length ? items.join(" | ") : "No filters";
}

export async function GET(request: Request) {
  if (!(await hasPermission("reports.export")) || !(await hasPermission("reports.employees.view"))) {
    return NextResponse.json({ error: "Access denied." }, { status: 403 });
  }
  const { searchParams } = new URL(request.url);
  const filters = getFilters(searchParams);
  const { generated, rows, selectedFields } = await getEmployeeReport(filters);

  if (!generated) {
    return NextResponse.json(
      { error: "Generate a report before exporting." },
      { status: 400 }
    );
  }

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Employee Report");
  const now = new Date();

  const fields = [...new Set<EmployeeReportFieldKey>(["file_number", "name", ...selectedFields])];
  const fieldMeta: Record<
    EmployeeReportFieldKey,
    { header: string; width: number; key: string }
  > = {
    file_number: { header: "File #", width: 16, key: "file_number" },
    name: { header: "Name", width: 28, key: "name" },
    department: { header: "Department", width: 18, key: "department" },
    job_title: { header: "Job Title", width: 22, key: "job_title" },
    start_date: { header: "Contract Start Date", width: 20, key: "start_date" },
    end_date: { header: "Contract End Date", width: 20, key: "end_date" },
    months: { header: "Contract Period / Months", width: 22, key: "months" },
    monthly_salary: { header: "Monthly Salary", width: 16, key: "monthly_salary" },
    total_salary: { header: "Total Contract Salary", width: 18, key: "total_salary" },
    gratuity_eligible: { header: "Gratuity Eligibility", width: 18, key: "gratuity_eligible" },
    estimated_gratuity: { header: "Estimated Gratuity", width: 18, key: "estimated_gratuity" },
    allowance_names: { header: "Allowance Names", width: 42, key: "allowance_names" },
    total_monthly_allowances: { header: "Total Monthly Allowances", width: 22, key: "total_monthly_allowances" },
    monthly_salary_plus_allowances: { header: "Monthly Salary + Allowances", width: 24, key: "monthly_salary_plus_allowances" },
    status: { header: "Contract Status", width: 16, key: "status" },
  };
  sheet.columns = fields.map((field) => ({
    key: fieldMeta[field].key,
    width: fieldMeta[field].width,
  }));

  const endColumnLetter = String.fromCharCode("A".charCodeAt(0) + Math.max(0, fields.length - 1));

  sheet.mergeCells(`A1:${endColumnLetter}1`);
  sheet.getCell("A1").value = "Employee Report";
  sheet.getCell("A1").font = { bold: true, size: 15 };
  sheet.getCell("A2").value = `Generated: ${now.toLocaleString()}`;
  sheet.getCell("A3").value = `Filters: ${filterSummary(filters)}`;
  const selectedFieldLabels = fields
    .map((field) => EMPLOYEE_REPORT_FIELD_OPTIONS.find((entry) => entry.key === field)?.label ?? field)
    .join(", ");
  sheet.getCell("A4").value = `Selected Fields: ${selectedFieldLabels}`;

  const headerRow = sheet.addRow(fields.map((field) => fieldMeta[field].header));
  headerRow.font = { bold: true };
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFEFEFEF" },
    };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });

  for (const row of rows) {
    const data = fields.map((field) => {
      if (field === "file_number") return row.file_number ?? "—";
      if (field === "name") return row.employee_name;
      if (field === "department") return row.department ?? "—";
      if (field === "job_title") return row.job_title ?? "—";
      if (field === "start_date") return row.contract_start_date ? new Date(row.contract_start_date) : "—";
      if (field === "end_date") return row.contract_end_date ? new Date(row.contract_end_date) : "—";
      if (field === "months") return row.contract_months ?? "—";
      if (field === "monthly_salary") return row.salary_amount ?? "—";
      if (field === "total_salary") return row.total_contract_salary ?? "—";
      if (field === "gratuity_eligible") return row.gratuity_eligible_display;
      if (field === "estimated_gratuity") {
        return row.estimated_gratuity_amount ?? row.estimated_gratuity_display;
      }
      if (field === "allowance_names") return row.allowance_names || "—";
      if (field === "total_monthly_allowances") return row.total_monthly_allowances ?? "—";
      if (field === "monthly_salary_plus_allowances") return row.monthly_salary_plus_allowances ?? "—";
      return row.effective_contract_status ?? "—";
    });
    const worksheetRow = sheet.addRow(data);

    fields.forEach((field, index) => {
      const cell = worksheetRow.getCell(index + 1);
      if ((field === "start_date" || field === "end_date") && cell.value instanceof Date) {
        cell.numFmt = "mmm dd, yyyy";
      }
      if ((field === "monthly_salary" || field === "total_salary") && typeof cell.value === "number") {
        cell.numFmt = '"$"#,##0.00';
      }
      if (field === "estimated_gratuity" && typeof cell.value === "number") {
        cell.numFmt = '"$"#,##0.00';
      }
      if (
        (field === "total_monthly_allowances" || field === "monthly_salary_plus_allowances") &&
        typeof cell.value === "number"
      ) {
        cell.numFmt = '"$"#,##0.00';
      }
    });
    if (fields.length === 0) {
      sheet.addRow(["—"]);
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="employee-report.xlsx"',
      "Cache-Control": "no-store",
    },
  });
}
