import PDFDocument from "pdfkit";
import { NextResponse } from "next/server";
import {
  getContractAvailabilityFilterSummary,
  getContractAvailabilityMode,
  getEmployeeReport,
  type EmployeeReportFilters,
} from "@/lib/queries/reports";

function getFilters(searchParams: URLSearchParams): EmployeeReportFilters {
  return {
    show: searchParams.get("show") ?? "",
    name: searchParams.get("name") ?? "",
    fileNumber: searchParams.get("fileNumber") ?? "",
    department: searchParams.get("department") ?? "",
    jobTitle: searchParams.get("jobTitle") ?? "",
    status: searchParams.get("status") ?? "",
    hasContracts: searchParams.get("hasContracts") ?? "",
    noContracts: searchParams.get("noContracts") ?? "",
  };
}

function filterSummary(filters: EmployeeReportFilters): string {
  const items: string[] = [];
  const { restrictToNoContractsOnly } = getContractAvailabilityMode(filters);
  if ((filters.show ?? "").trim().toLowerCase() === "all") items.push("Show: all");
  if ((filters.name ?? "").trim()) items.push(`Name: ${filters.name}`);
  if ((filters.fileNumber ?? "").trim()) items.push(`File Number: ${filters.fileNumber}`);
  if ((filters.department ?? "").trim()) items.push(`Department: ${filters.department}`);
  if ((filters.jobTitle ?? "").trim()) items.push(`Job Title: ${filters.jobTitle}`);
  if ((filters.status ?? "").trim() && !restrictToNoContractsOnly) {
    items.push(`Status: ${filters.status}`);
  }
  const contractAvail = getContractAvailabilityFilterSummary(filters);
  if (contractAvail) items.push(contractAvail);
  return items.length ? items.join(" | ") : "No filters";
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString();
}

function formatSalary(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filters = getFilters(searchParams);
  const { generated, rows } = await getEmployeeReport(filters);

  if (!generated) {
    return NextResponse.json(
      { error: "Generate a report before exporting." },
      { status: 400 }
    );
  }

  const doc = new PDFDocument({
    margin: 24,
    size: "LETTER",
    layout: "landscape",
  });

  const chunks: Buffer[] = [];
  doc.on("data", (chunk) => chunks.push(chunk as Buffer));
  const finished = new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  const title = "Employee Report";
  const generatedAt = `Generated: ${new Date().toLocaleString()}`;
  const filterText = `Filters: ${filterSummary(filters)}`;
  doc.fontSize(16).text(title, { align: "left" });
  doc.moveDown(0.3);
  doc.fontSize(10).text(generatedAt);
  doc.fontSize(10).text(filterText, { width: 730 });
  doc.moveDown(0.8);

  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const colWidths = [70, 140, 90, 110, 85, 85, 70, 70];
  const headers = [
    "File #",
    "Name",
    "Department",
    "Job Title",
    "Contract Start",
    "Contract End",
    "Salary",
    "Status",
  ];

  let y = doc.y;
  const rowHeight = 20;
  const maxY = doc.page.height - doc.page.margins.bottom - 24;

  const drawHeader = () => {
    let x = doc.page.margins.left;
    doc.fontSize(9).font("Helvetica-Bold");
    headers.forEach((header, index) => {
      doc.rect(x, y, colWidths[index] ?? 0, rowHeight).stroke("#D4D4D4");
      doc.text(header, x + 4, y + 6, {
        width: (colWidths[index] ?? 0) - 8,
        align: "left",
      });
      x += colWidths[index] ?? 0;
    });
    y += rowHeight;
  };

  if (colWidths.reduce((sum, width) => sum + width, 0) > pageWidth) {
    doc.fontSize(8).font("Helvetica").text("Note: table scaled to page width.");
  }

  drawHeader();
  doc.font("Helvetica").fontSize(9);

  for (const row of rows) {
    if (y + rowHeight > maxY) {
      doc.addPage({ margin: 24, size: "LETTER", layout: "landscape" });
      y = doc.page.margins.top;
      drawHeader();
      doc.font("Helvetica").fontSize(9);
    }

    const values = [
      row.file_number ?? "—",
      row.employee_name,
      row.department ?? "—",
      row.job_title ?? "—",
      formatDate(row.contract_start_date),
      formatDate(row.contract_end_date),
      formatSalary(row.salary_amount),
      row.effective_contract_status ?? "—",
    ];

    let x = doc.page.margins.left;
    values.forEach((value, index) => {
      doc.rect(x, y, colWidths[index] ?? 0, rowHeight).stroke("#E5E5E5");
      doc.text(value, x + 4, y + 6, {
        width: (colWidths[index] ?? 0) - 8,
        align: "left",
        ellipsis: true,
      });
      x += colWidths[index] ?? 0;
    });
    y += rowHeight;
  }

  const pageCount = doc.bufferedPageRange().count;
  for (let i = 0; i < pageCount; i += 1) {
    doc.switchToPage(i);
    doc.fontSize(8).text(`Page ${i + 1} of ${pageCount}`, 0, doc.page.height - 20, {
      align: "center",
    });
  }

  doc.end();
  const pdfBuffer = await finished;
  const binary = new Uint8Array(pdfBuffer);
  return new NextResponse(binary, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="employee-report.pdf"',
      "Cache-Control": "no-store",
    },
  });
}
