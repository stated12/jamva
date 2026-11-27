import { NextResponse } from "next/server";
import { getProfile } from "@/lib/session";
import { loadLeads, csvCell } from "@/lib/leads";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  const p = await getProfile(); if (!p || p.role !== "admin") return new NextResponse("Forbidden", { status: 403 });
  const u = new URL(req.url).searchParams; const rows = await loadLeads({ role: u.get("role") || undefined, city: u.get("city") || undefined, status: u.get("status") || undefined, fssai: u.get("fssai") || undefined, q: u.get("q") || undefined });
  const head = ["Role", "Name", "Contact person", "Phone", "City", "Area", "PIN", "Status", "FSSAI", "Note", "Created"];
  const body = rows.map((l) => [l.role, l.name, l.owner, l.phone, l.city, l.area, l.pin, l.status, l.fssai, l.note, l.created].map(csvCell).join(","));
  return new NextResponse([head.map(csvCell).join(","), ...body].join("\n"), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="jamva-registrations.csv"' } });
}
