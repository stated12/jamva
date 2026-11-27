import { db } from "@/lib/db";
import { requireDriver, driverBalance } from "@/lib/drivers";
import { rupees, dateFmt } from "@/lib/format";
import { saveDriverProfile } from "../actions";
export const dynamic = "force-dynamic";
export default async function Page({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const sp = await searchParams; const { d } = await requireDriver(); const b = await driverBalance(d.id);
  const { data: rides } = await db().from("orders").select("id,code,delivered_at,driver_pay_paise,payment_method,total_paise").eq("driver_id", d.id).eq("status", "delivered").order("delivered_at", { ascending: false }).limit(30);
  const { data: led } = await db().from("driver_ledger").select("*").eq("driver_id", d.id).order("created_at", { ascending: false }).limit(20);
  const tiles: [string, string][] = [["Deliveries", String(b.deliveries)], ["Total earned", rupees(b.earned)], ["Paid to you", rupees(b.paid)], ["To be paid", rupees(b.payable)]];
  return (<div><h1 className="text-3xl">Earnings</h1>{sp.saved && <p className="mt-3 rounded-xl bg-leaf-soft p-3 font-semibold text-leaf">Saved.</p>}
    <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">{tiles.map(([l, v]) => <div key={l} className="card p-4"><p className="text-xs font-bold text-muted">{l}</p><p className="font-display text-2xl">{v}</p></div>)}</div>
    <div className="card mt-4 p-4 text-sm"><p className="font-bold">Cash on delivery</p><p className="text-muted">Collected {rupees(b.cash)} · handed in {rupees(b.deposited)} · <b className={b.cashHeld > 0 ? "text-chilli" : "text-leaf"}>with you {rupees(b.cashHeld)}</b>. Hand cash to Jamva as agreed and we will record it here.</p></div>
    <h2 className="mt-8 text-2xl">Recent deliveries</h2><ul className="card mt-3 divide-y divide-line text-sm">{(rides || []).map((r: any) => <li key={r.id} className="flex justify-between p-3"><span>{r.code} · {dateFmt(r.delivered_at)}{r.payment_method === "cod" ? " · cash" : ""}</span><b>{rupees(r.driver_pay_paise)}</b></li>)}{!(rides || []).length && <li className="p-3 text-muted">No deliveries yet.</li>}</ul>
    <h2 className="mt-8 text-2xl">Payouts and cash handed in</h2><ul className="card mt-3 divide-y divide-line text-sm">{(led || []).map((l: any) => <li key={l.id} className="flex justify-between p-3"><span>{l.kind === "payout" ? "Payout to you" : "Cash handed in"} · {dateFmt(l.created_at)}{l.note ? ` · ${l.note}` : ""}</span><b>{rupees(l.amount_paise)}</b></li>)}{!(led || []).length && <li className="p-3 text-muted">Nothing yet. Payouts are made weekly.</li>}</ul>
    <details className="card mt-8 p-5"><summary className="cursor-pointer text-xl font-extrabold">My details and payout account</summary><form action={saveDriverProfile} className="mt-4 grid gap-3 sm:grid-cols-2">
      <div><label className="label">Phone</label><input name="phone" defaultValue={d.phone} className="input" /></div><div><label className="label">Vehicle</label><input name="vehicle" defaultValue={d.vehicle || ""} className="input" /></div>
      <div><label className="label">Vehicle number</label><input name="vehicle_no" defaultValue={d.vehicle_no || ""} className="input" /></div><div><label className="label">UPI ID</label><input name="upi_id" defaultValue={d.upi_id || ""} className="input" /></div>
      <div><label className="label">Bank account number</label><input name="bank_account" defaultValue={d.bank_account || ""} className="input" inputMode="numeric" /></div><div><label className="label">IFSC</label><input name="bank_ifsc" defaultValue={d.bank_ifsc || ""} className="input" /></div>
      <button className="btn btn-primary sm:col-span-2">Save</button></form></details></div>);
}
