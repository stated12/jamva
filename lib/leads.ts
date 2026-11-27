import { db } from "./db";
export type Lead = { src: "r" | "d" | "w"; id: string; role: "restaurant" | "vendor" | "driver"; name: string; owner: string; phone: string; city: string; area: string; pin: string; status: string; fssai: string; note: string; created: string; raw?: string; lat?: number | null; lng?: number | null; kind?: string };
export type LeadFilter = { role?: string; city?: string; status?: string; fssai?: string; q?: string };
const FSSAI: Record<string, string> = { have: "Have FSSAI", applied: "Applied", help: "Needs help" };
/** Every registration and waitlist lead in one list, so the founder can filter, approve and export from one place. */
export async function loadLeads(f: LeadFilter = {}): Promise<Lead[]> {
  const [{ data: rs }, { data: ds }, { data: ws }] = await Promise.all([
    db().from("restaurants").select("id,name,owner_name,phone,city,pincode,status,is_open,kind,fssai_no,fssai_status,admin_note,created_at,lat,lng,areas:jm_areas(name)").order("created_at", { ascending: false }).limit(500),
    db().from("drivers").select("id,name,phone,city,pincode,status,is_online,admin_note,created_at,licence_status,areas:jm_areas(name)").order("created_at", { ascending: false }).limit(500),
    db().from("waitlist").select("id,name,phone,kind,city,pincode,area_slug,status,note,details,created_at").neq("kind", "customer").order("created_at", { ascending: false }).limit(500),
  ]);
  const out: Lead[] = [];
  (rs || []).forEach((r: any) => out.push({ src: "r", id: r.id, role: r.kind === "street_vendor" ? "vendor" : "restaurant", name: r.name, owner: r.owner_name || "", phone: r.phone || "", city: r.city || "Ahmedabad", area: r.areas?.name || "", pin: r.pincode || "",
    status: r.status === "pending" ? "Pending" : r.status === "approved" ? (r.is_open ? "Live" : "Approved") : "Rejected", fssai: r.fssai_no ? `Have FSSAI (${r.fssai_no})` : FSSAI[r.fssai_status] || "", note: r.admin_note || "", created: r.created_at, lat: r.lat, lng: r.lng, kind: r.kind }));
  (ds || []).forEach((d: any) => out.push({ src: "d", id: d.id, role: "driver", name: d.name, owner: "", phone: d.phone || "", city: d.city || "Ahmedabad", area: d.areas?.name || "", pin: d.pincode || "", status: d.status === "pending" ? "Pending" : d.status === "active" ? (d.is_online ? "Live" : "Approved") : "Rejected", fssai: "", note: d.admin_note || "", created: d.created_at }));
  (ws || []).forEach((w: any) => out.push({ src: "w", id: w.id, role: w.kind === "vendor" ? "vendor" : w.kind === "driver" ? "driver" : "restaurant", name: w.details?.business || w.name || "", owner: w.name || "", phone: w.phone || "", city: w.city || "", area: w.area_slug || "", pin: w.pincode || "", status: "Waitlisted", fssai: FSSAI[w.details?.fssai_status] || "", note: w.note || "", created: w.created_at, raw: w.status }));
  const q = (f.q || "").toLowerCase().trim();
  return out.filter((l) => (!f.role || l.role === f.role) && (!f.city || l.city.toLowerCase() === f.city.toLowerCase()) && (!f.status || l.status === f.status) && (!f.fssai || l.fssai.startsWith(FSSAI[f.fssai] || "~")) && (!q || [l.name, l.owner, l.phone, l.city, l.area, l.pin].join(" ").toLowerCase().includes(q))).sort((a, b) => +new Date(b.created) - +new Date(a.created));
}
export const csvCell = (v: unknown) => { let s = String(v ?? ""); if (/^[=+\-@]/.test(s)) s = "'" + s; return `"${s.replace(/"/g, '""')}"`; };
