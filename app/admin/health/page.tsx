import { db } from "@/lib/db";
import { SEED_AREAS } from "@/lib/seed";
export const dynamic = "force-dynamic";
const TABLES = ["profiles", "admin_emails", "settings", "areas", "cities", "restaurants", "menu_items", "drivers", "driver_ledger", "orders", "payments", "waitlist", "contact_messages"];
export default async function Page() {
  const rows = await Promise.all(TABLES.map(async (t) => { try { const { count, error } = await db().from(t).select("*", { count: "exact", head: true }); return { t, n: count ?? 0, err: error?.message || "" }; } catch (e: any) { return { t, n: 0, err: String(e?.message || e) }; } }));
  let seedErr = ""; try { const { error } = await db().from("areas").upsert(SEED_AREAS.map(([slug, name, lat, lng], i) => ({ slug, name, lat, lng, sort_order: i + 1 })), { onConflict: "slug" }); seedErr = error?.message || ""; } catch (e: any) { seedErr = String(e?.message || e); }
  const colCheck = async (t: string, cols: string) => { try { const { error } = await db().from(t).select(cols).limit(1); return error?.message || ""; } catch (e: any) { return String(e?.message || e); } };
  const m3 = await colCheck("drivers", "vehicle_no,licence_no,area_id"), m4 = await colCheck("restaurants", "kind,landmark,fssai_status,city");
  const ok = (b: boolean) => <b className={b ? "text-leaf" : "text-chilli"}>{b ? "OK" : "PROBLEM"}</b>;
  return (<div><h1 className="text-3xl">System check</h1><p className="mt-1 text-sm text-muted">If something says PROBLEM, copy the message and send it to your developer, or run the matching SQL file in Supabase.</p>
    <div className="card mt-4 p-4 text-sm"><p>Migration 03 (rider app): {ok(!m3)} {m3}</p><p>Migration 04 (vendors, cities): {ok(!m4)} {m4}</p><p>Writing areas to the database: {ok(!seedErr)} {seedErr}</p><p>Service role key set: {ok(!!process.env.SUPABASE_SERVICE_ROLE_KEY)}</p></div>
    <table className="card mt-4 w-full text-left text-sm"><thead><tr className="text-muted"><th className="p-2">Table (jm_)</th><th>Rows</th><th>Status</th></tr></thead><tbody>{rows.map((r) => <tr key={r.t} className="border-t border-line"><td className="p-2 font-bold">{r.t}</td><td>{r.n}</td><td>{ok(!r.err)} {r.err}</td></tr>)}</tbody></table></div>);
}
