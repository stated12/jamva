import { db } from "@/lib/db";
import { SEED_AREAS } from "@/lib/seed";
import { razorpayConfigured, razorpayMode, supabaseService } from "@/lib/env";
import { pingRzp } from "@/lib/razorpay";
import { reconcileNow } from "../actions";
export const dynamic = "force-dynamic";
const TABLES = ["profiles", "admin_emails", "settings", "areas", "cities", "restaurants", "menu_items", "drivers", "driver_ledger", "orders", "payments", "waitlist", "contact_messages"];
export default async function Page() {
  const rows = await Promise.all(TABLES.map(async (t) => { try { const { count, error } = await db().from(t).select("*", { count: "exact", head: true }); return { t, n: count ?? 0, err: error?.message || "" }; } catch (e: any) { return { t, n: 0, err: String(e?.message || e) }; } }));
  let seedErr = ""; try { const { error } = await db().from("areas").upsert(SEED_AREAS.map(([slug, name, lat, lng], i) => ({ slug, name, lat, lng, sort_order: i + 1 })), { onConflict: "slug" }); seedErr = error?.message || ""; } catch (e: any) { seedErr = String(e?.message || e); }
  const colCheck = async (t: string, cols: string) => { try { const { error } = await db().from(t).select(cols).limit(1); return error?.message || ""; } catch (e: any) { return String(e?.message || e); } };
  const m3 = await colCheck("drivers", "vehicle_no,licence_no,area_id"), m4 = await colCheck("restaurants", "kind,landmark,fssai_status,city");
  let rzpErr = ""; if (razorpayConfigured()) { try { await pingRzp(); } catch (e: any) { rzpErr = String(e?.message || e); } } else rzpErr = "RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET missing";
  // Which kind of key is in SUPABASE_SERVICE_ROLE_KEY, and which database role does the app actually run as? (The key itself is never shown.)
  const sk = supabaseService(); let keyKind = "missing"; if (sk) { if (sk.startsWith("sb_secret_")) keyKind = "service (new secret key)"; else if (sk.startsWith("sb_publishable_")) keyKind = "ANON / publishable (wrong key)"; else { try { const role = JSON.parse(Buffer.from(sk.split(".")[1] || "", "base64url").toString()).role; keyKind = role === "service_role" ? "service_role" : `${role || "unknown"} (wrong key)`; } catch { keyKind = "unreadable"; } } }
  let whoami = ""; try { const r = await db().rpc("whoami"); whoami = r.error ? "unknown: " + r.error.message : String(r.data); } catch (e: any) { whoami = "unknown: " + String(e?.message || e); }
  const roleOk = keyKind.startsWith("service") && whoami === "service_role";
  const ok = (b: boolean) => <b className={b ? "text-leaf" : "text-chilli"}>{b ? "OK" : "PROBLEM"}</b>;
  return (<div><h1 className="text-3xl">System check</h1><p className="mt-1 text-sm text-muted">If something says PROBLEM, copy the message and send it to your developer, or run the matching SQL file in Supabase.</p>
    <div className="card mt-4 p-4 text-sm"><p>Migration 03 (rider app): {ok(!m3)} {m3}</p><p>Migration 04 (vendors, cities): {ok(!m4)} {m4}</p><p>Writing areas to the database: {ok(!seedErr)} {seedErr}</p><p>Key in SUPABASE_SERVICE_ROLE_KEY is: <b>{keyKind}</b></p><p>Database role the app is using: <b>{whoami || "?"}</b> {ok(roleOk)} {roleOk ? "" : "Must be service_role. Copy the service_role (secret) key from Supabase > Project Settings > API into Vercel, then redeploy. If it already is, run 08_permissions.sql."}</p><p>Service role key set: {ok(!!process.env.SUPABASE_SERVICE_ROLE_KEY)}</p></div>
    <div className="card mt-4 p-4 text-sm"><p className="font-bold">Razorpay</p><p>Mode: <b>{razorpayMode().toUpperCase()}</b> {razorpayMode() === "live" ? "(real money)" : razorpayMode() === "test" ? "(test, no real money)" : ""}</p><p>Keys accepted by Razorpay: {ok(!rzpErr)} {rzpErr}</p><p>Webhook secret set: {ok(!!process.env.RAZORPAY_WEBHOOK_SECRET)}</p><p>Daily safety job secret (CRON_SECRET) set: {ok(!!process.env.CRON_SECRET)}</p><p>Public site URL set: {ok(!!process.env.NEXT_PUBLIC_SITE_URL)}</p>
      <form action={reconcileNow} className="mt-3"><button className="btn btn-dark !py-2 text-sm">Check Razorpay for missed payments now</button></form></div>
    <table className="card mt-4 w-full text-left text-sm"><thead><tr className="text-muted"><th className="p-2">Table (jm_)</th><th>Rows</th><th>Status</th></tr></thead><tbody>{rows.map((r) => <tr key={r.t} className="border-t border-line"><td className="p-2 font-bold">{r.t}</td><td>{r.n}</td><td>{ok(!r.err)} {r.err}</td></tr>)}</tbody></table></div>);
}
