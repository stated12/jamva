import { db } from "@/lib/db";
import { requireDriver, riderPay, getDriverCfg, ACTIVE_STATUSES } from "@/lib/drivers";
import { rupees, dateFmt, STATUS_LABEL } from "@/lib/format";
import { claimOrder, driverAction, toggleOnline } from "./actions";
import AutoRefresh from "@/components/AutoRefresh";
import JobAlert from "@/components/JobAlert";
import PushButton from "@/components/PushButton";
export const dynamic = "force-dynamic";
const MSG: Record<string, string> = { gone: "That delivery was just taken by someone else, or you already hold the maximum number of active deliveries." };
export default async function Page({ searchParams }: { searchParams: Promise<{ welcome?: string; taken?: string; e?: string }> }) {
  const sp = await searchParams; const { d } = await requireDriver(); const cfg = await getDriverCfg();
  if (d.status === "pending") return (<div className="card p-6"><h1 className="text-3xl">Application received</h1><p className="mt-2 text-muted">Thank you, {d.name}. We are checking your licence and vehicle details and will notify you here and by email once you are approved.</p></div>);
  if (d.status === "blocked") return (<div className="card p-6"><h1 className="text-3xl">Account not active</h1><p className="mt-2 text-muted">{d.admin_note || "Please contact Jamva support."}</p></div>);
  const { data: mine } = await db().from("orders").select("*, restaurants:jm_restaurants(name,address,phone,owner_id)").eq("driver_id", d.id).in("status", ACTIVE_STATUSES).order("driver_assigned_at");
  const { data: open } = d.is_online ? await db().from("orders").select("id,code,status,distance_km,delivery_fee_paise,payment_method,total_paise,address,restaurants:jm_restaurants(name,address)").is("driver_id", null).in("status", ["accepted", "preparing", "ready"]).order("created_at").limit(20) : { data: [] };
  const mineIds = (mine || []).map((o: any) => o.id); const { data: its } = mineIds.length ? await db().from("order_items").select("order_id,name,qty").in("order_id", mineIds) : { data: [] };
  const holding = (mine || []).length, full = holding >= (cfg.max_active || 2);
  return (<div><AutoRefresh every={30000} /><JobAlert initial={(open || []).length} />
    <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="kicker">Hello, {d.name}</p><h1 className="text-3xl">{d.is_online ? "You are online" : "You are offline"}</h1></div>
      <form action={toggleOnline}><button className={`btn ${d.is_online ? "btn-green" : "btn-line"}`}>{d.is_online ? "● Online: tap to go offline" : "○ Offline: tap to go online"}</button></form></div>
    {sp.welcome && <p className="mt-4 rounded-xl bg-leaf-soft p-3 font-semibold text-leaf">Application received. We will approve you shortly.</p>}{sp.taken && <p className="mt-4 rounded-xl bg-leaf-soft p-3 font-semibold text-leaf">Delivery assigned to you. Head to the restaurant.</p>}{sp.e && <p className="mt-4 rounded-xl bg-soft p-3 text-sm font-semibold text-chilli">{MSG[sp.e] || "Something went wrong. Please try again."}</p>}
    <div className="mt-4"><PushButton label="Turn on delivery alerts on this phone" /></div>
    <h2 className="mt-8 text-2xl">My deliveries {holding > 0 && <span className="chip ml-2">{holding}</span>}</h2>
    {holding ? <ul className="mt-3 space-y-3">{(mine || []).map((o: any) => (<li key={o.id} className="card p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-extrabold">{o.code} <span className="chip ml-1">{STATUS_LABEL[o.status]}</span></p><p className="text-xs text-muted">Earn {rupees(riderPay(o.delivery_fee_paise, cfg))}{o.distance_km ? ` · about ${o.distance_km} km` : ""}</p></div>
        {o.payment_method === "cod" ? <p className="rounded-lg bg-chilli px-2 py-1 text-sm font-extrabold text-white">Collect {rupees(o.total_paise)}</p> : <p className="rounded-lg bg-leaf-soft px-2 py-1 text-sm font-extrabold text-leaf">Paid online</p>}</div>
      {o.status !== "picked_up" ? (<div className="mt-3 rounded-xl bg-soft p-3 text-sm"><p className="font-bold">1. Pick up from {o.restaurants?.name}</p><p>{o.restaurants?.address}</p>{o.restaurants?.phone && <a className="font-bold text-chilli" href={`tel:${o.restaurants.phone}`}>Call restaurant</a>}</div>) : null}
      <div className="mt-2 rounded-xl bg-soft p-3 text-sm"><p className="font-bold">{o.status === "picked_up" ? "Deliver to" : "2. Deliver to"} {o.customer_name}</p><p>{o.address?.line1}{o.address?.landmark ? `, ${o.address.landmark}` : ""}, {o.address?.area}</p><a className="font-bold text-chilli" href={`tel:${o.customer_phone}`}>Call customer</a>{o.notes && <p className="mt-1">Note: {o.notes}</p>}</div>
      <ul className="mt-3 text-sm">{(its || []).filter((i: any) => i.order_id === o.id).map((i: any, k: number) => <li key={k}><b>{i.qty} ×</b> {i.name}</li>)}</ul>
      <form action={driverAction} className="mt-3 flex flex-wrap gap-2"><input type="hidden" name="id" value={o.id} />
        {o.status === "ready" && <button name="act" value="pickup" className="btn btn-dark !py-2 text-sm">Picked up</button>}
        {o.status !== "ready" && o.status !== "picked_up" && <span className="chip">Waiting for the kitchen to mark it ready</span>}
        {o.status === "picked_up" && <button name="act" value="delivered" className="btn btn-green !py-2 text-sm">{o.payment_method === "cod" ? `Delivered, cash ${rupees(o.total_paise)} collected` : "Delivered"}</button>}
        {o.status !== "picked_up" && <button name="act" value="release" className="btn btn-line !py-2 text-sm">Cannot do this one</button>}</form></li>))}</ul> : <p className="mt-3 text-muted">No active delivery.</p>}
    <h2 className="mt-8 text-2xl">Open deliveries</h2>
    {!d.is_online ? <p className="mt-3 text-muted">Go online to see deliveries you can take.</p> : (open || []).length ? <ul className="mt-3 space-y-3">{(open || []).map((o: any) => (<li key={o.id} className="card flex items-center justify-between gap-3 p-4"><div><p className="font-extrabold">{o.restaurants?.name} → {o.address?.area}</p><p className="text-xs text-muted">{o.distance_km ? `${o.distance_km} km · ` : ""}{o.payment_method === "cod" ? `Cash ${rupees(o.total_paise)}` : "Prepaid"} · {STATUS_LABEL[o.status]}</p><p className="mt-1 font-extrabold text-leaf">Earn {rupees(riderPay(o.delivery_fee_paise, cfg))}</p></div>
      <form action={claimOrder}><input type="hidden" name="id" value={o.id} /><button disabled={full} className="btn btn-primary !py-2 text-sm disabled:opacity-50">{full ? "Finish current" : "Take it"}</button></form></li>))}</ul> : <p className="mt-3 text-muted">Nothing open right now. You will hear a sound when a delivery appears.</p>}
  </div>);
}
