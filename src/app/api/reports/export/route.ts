import ExcelJS from "exceljs";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { NextResponse } from "next/server";
import { requireProfile } from "@/lib/auth";
import { canGenerateReports } from "@/lib/rbac";
import { createClient } from "@/lib/supabase/server";

type Row = Record<string, string | number | null>;

async function loadReport(type: string): Promise<{ title: string; rows: Row[] }> {
  const supabase = await createClient();
  if (type === "vendors" || type === "contractors") {
    const kind = type === "vendors" ? "vendor" : "contractor";
    const { data } = await supabase.from("crm_companies").select("company_code, company_name, registration_number, status, state, email, rating").eq("company_kind", kind);
    return { title: `${kind} list`, rows: data ?? [] };
  }
  if (type === "registrations") {
    const { data } = await supabase.from("crm_companies").select("company_code, company_name, company_kind, status, registration_date, created_at");
    return { title: "Company registration", rows: data ?? [] };
  }
  if (type === "expired-documents" || type === "expiring-documents") {
    const status = type === "expired-documents" ? "expired" : "expiring_soon";
    const { data } = await supabase.from("crm_documents").select("document_code, document_name, status, expiry_date, company:crm_companies(company_name)");
    return {
      title: type,
      rows: (data ?? [])
        .filter((d) => d.status === status)
        .map((d) => {
          const company = Array.isArray(d.company) ? d.company[0] : d.company;
          return {
            document_code: d.document_code,
            document_name: d.document_name,
            company: company?.company_name ?? "",
            expiry_date: d.expiry_date,
            status: d.status,
          };
        }),
    };
  }
  if (type === "active-projects" || type === "completed-projects") {
    const status = type === "active-projects" ? "active" : "completed";
    const { data } = await supabase.from("crm_projects").select("project_code, project_name, status, project_value, end_date").eq("status", status);
    return { title: type, rows: data ?? [] };
  }
  if (type === "activities") {
    const { data } = await supabase.from("crm_activities").select("activity_code, activity_type, subject, status, activity_date");
    return { title: "Activities", rows: data ?? [] };
  }
  if (type === "payments" || type === "revenue") {
    const { data } = await supabase.from("crm_payments").select("payment_code, payment_type, amount, currency, status, paid_at, created_at");
    const rows = type === "revenue" ? (data ?? []).filter((p) => p.status === "paid") : (data ?? []);
    return { title: type, rows };
  }
  if (type === "vendor-performance" || type === "contractor-performance") {
    const kind = type.startsWith("vendor") ? "vendor" : "contractor";
    const { data } = await supabase.from("crm_companies").select("company_code, company_name, rating, status").eq("company_kind", kind);
    return { title: type, rows: data ?? [] };
  }
  return { title: "Report", rows: [] };
}

function csv(rows: Row[]) {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  return [headers.join(","), ...rows.map((row) => headers.map((h) => JSON.stringify(row[h] ?? "")).join(","))].join("\n");
}

export async function GET(request: Request) {
  const profile = await requireProfile();
  if (!canGenerateReports(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "vendors";
  const format = searchParams.get("format") || "csv";
  const report = await loadReport(type);

  if (format === "xlsx") {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(report.title.slice(0, 31));
    if (report.rows.length) {
      const headers = Object.keys(report.rows[0]);
      sheet.addRow(headers);
      report.rows.forEach((row) => sheet.addRow(headers.map((h) => row[h])));
    }
    const buffer = await workbook.xlsx.writeBuffer();
    return new NextResponse(Buffer.from(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${type}.xlsx"`,
      },
    });
  }

  if (format === "pdf") {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("UBBIM Corporate CRM", 14, 16);
    doc.setFontSize(11);
    doc.text(report.title, 14, 24);
    const headers = report.rows[0] ? Object.keys(report.rows[0]) : ["No data"];
    autoTable(doc, {
      startY: 30,
      head: [headers],
      body: report.rows.map((row) => headers.map((h) => String(row[h] ?? ""))),
    });
    const buffer = doc.output("arraybuffer");
    return new NextResponse(Buffer.from(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${type}.pdf"`,
      },
    });
  }

  return new NextResponse(csv(report.rows), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${type}.csv"`,
    },
  });
}
