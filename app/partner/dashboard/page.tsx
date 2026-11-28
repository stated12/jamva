import Link from "next/link";
import { db } from "@/lib/db";
import { requireRestaurant } from "@/lib/session";
import { rupees, dateFmt, dayFmt, todayIST, STATUS_LABEL } from "@/lib/format";
import { getListing, getVendorListing } from "@/lib/pricing";
import LocationUpdate from "@/components/LocationUpdate";
import InstallApp from "@/components/InstallApp";
import { getT } from "@/lib/i18n";
import { orderAction, toggleOpen, updateRestaurant } from "../actions";
import NewOrderAlert from "@/components/NewOrderAlert";
import RealtimeRefresh from "@/components/RealtimeRefresh";
import PushButton from "@/components/PushButton";
import ListingPay from "@/components/PayButton";
export const metadata = { title: "Restaurant dashboard" };
export const dynamic = "force-dynamic";

const STEPK: Record<string, string> = { placed: "p_accept", accepted: "p_start", preparing: "p_ready" };
export default async function Page({ searchParams }: { searchParams: Promise<{ welcome?: string; saved?: string; paid?: string }> }) {
  const sp = await searchParams; const { t } = await getT(); const { r } = await requireRestaurant(); const vendor = r.kind === "street_vendor"; const l = await getListing(); const vl = await getVendorListing();
  const { data: orders } = await db().from("orders").select("*, drivers:jm_drivers(name,phone)").eq("restaurant_id", r.id).neq("status", "pending_payment").order("created_at", { ascending: false }).limit(40);
  const ids = (orders || []).map((o: any) => o.id); const { data: its } = ids.length ? await db().from("order_items").select("*").in("order_id", ids) : { data: [] };
  const active = (orders || []).filter((o: any) => !["delivered", "cancelled", "rejected"].includes(o.status)); const done = (orders || []).filter((o: any) => ["delivered", "cancelled", "rejected"].includes(o.status));
  const today = todayIST(); const trialDays = r.trial_until && r.trial_until >= today ? Math.ceil((+new Date(r.trial_until) - +new Date(today)) / 864e5) : 0;
  const listed = (r.listing_paid_until && r.listing_paid_until >= today) || trialDays > 0; const waiting = active.filter((o: any) => o.status === "placed").length;
  const Card = ({ o }: { o: any }) => (<li className="card p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-extrabold">{o.code} <span className="chip ml-1">{STATUS_LABEL[o.status]}</span></p><p className="text-xs text-muted">{dateFmt(o.created_at)} · {o.payment_method === "cod" ? "Cash on delivery: collect " + rupees(o.total_paise) : "Paid online"}</p></div><p className="font-extrabold">{rupees(o.subtotal_paise)}</p></div>
    <ul className="mt-3 text-sm">{(its || []).filter((i: any) => i.order_id === o.id).map((i: any) => <li key={i.id}><b>{i.qty} ×</b> {i.name}</li>)}</ul>{o.notes && <p className="mt-2 rounded-lg bg-soft p-2 text-sm">Note: {o.notes}</p>}
    <p className="mt-2 text-xs text-muted">Customer: {o.customer_name} · <a className="underline" href={`tel:${o.customer_phone}`}>{o.customer_phone}</a> · {o.address?.line1}, {o.address?.area}</p>
    {o.drivers && !["delivered", "cancelled", "rejected"].includes(o.status) && <p className="mt-2 rounded-lg bg-leaf-soft p-2 text-sm font-semibold text-leaf">Rider: {o.drivers.name} · <a className="underline" href={`tel:${o.drivers.phone}`}>{o.drivers.phone}</a></p>}
    {["placed", "accepted", "preparing", "ready", "picked_up"].includes(o.status) && <form action={orderAction} className="mt-3 flex flex-wrap gap-2"><input type="hidden" name="id" value={o.id} />
      {STEPK[o.status] && <button name="act" value="next" className="btn btn-green !py-2 text-sm">{t(STEPK[o.status])}</button>}{o.status === "ready" && <button name="act" value="pickup" className="btn btn-dark !py-2 text-sm">{o.drivers ? "Handed to rider" : "Handed to rider (own delivery)"}</button>}{o.status === "picked_up" && <button name="act" value="delivered" className="btn btn-dark !py-2 text-sm">{t("p_mark_deliv")}</button>}{o.status === "placed" && <button name="act" value="reject" className="btn btn-line !py-2 text-sm">{t("p_decline")}</button>}</form>}</li>);
  return (<div className="wrap max-w-3xl py-8"><RealtimeRefresh subs={[{ table: "jm_orders", filter: `restaurant_id=eq.${r.id}` }]} fast={20000} slow={120000} labels={{ live: t("rt_live"), reconnecting: t("rt_reconnecting") }} />
    <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="kicker">{vendor ? "Street vendor dashboard" : "Restaurant dashboard"}</p><h1 className="text-3xl md:text-4xl">{r.name}</h1></div>
      {r.status === "approved" && <form action={toggleOpen}><button className={`btn ${r.is_open ? "btn-green" : "btn-line"}`}>{r.is_open ? t("p_open_btn") : t("p_closed_btn")}</button></form>}</div>
    {sp.welcome && <p className="mt-4 rounded-xl bg-leaf-soft p-3 font-semibold text-leaf">Application received. We will verify your FSSAI details and approve you shortly. You will get an alert.</p>}{sp.saved && <p className="mt-4 rounded-xl bg-leaf-soft p-3 font-semibold text-leaf">Saved.</p>}{sp.paid && <p className="mt-4 rounded-xl bg-leaf-soft p-3 font-semibold text-leaf">Payment received. Your listing will update in a moment.</p>}
    {r.status === "pending" && <div className="card mt-6 p-5"><h2 className="text-2xl">Awaiting approval</h2><p className="mt-1 text-muted">We are checking your details. Meanwhile you can <Link href="/partner/menu" className="font-bold text-chilli">build your menu</Link>.</p></div>}
    {(r.status === "rejected" || r.status === "suspended") && <div className="card mt-6 p-5"><h2 className="text-2xl capitalize">{r.status}</h2><p className="mt-1 text-muted">{r.admin_note || "Please contact Jamva support."}</p></div>}
    {r.status === "approved" && <div className="card mt-6 grid gap-4 p-5 md:grid-cols-2"><div><p className="kicker">Listing</p><p className="mt-1 font-bold">{r.listing_paid_until && r.listing_paid_until >= today ? `Paid until ${dayFmt(r.listing_paid_until)}` : trialDays > 0 ? `Free trial: ${trialDays} day${trialDays > 1 ? "s" : ""} left` : "Expired: you are hidden from customers"}</p><p className="text-sm text-muted">{vendor ? `₹${vl.monthly_fee} a month or ₹${vl.yearly_fee} a year + ${vl.gst_percent}% GST. Zero commission.` : `Yearly fee ${rupees(l.yearly_fee * 100)} + ${l.gst_percent}% GST. Zero commission.`}</p></div><div className="flex flex-wrap items-center gap-2 md:justify-end">{vendor ? <><ListingPay plan="monthly" label={`Pay monthly ${rupees(Math.round(vl.monthly_fee * 100 * (1 + vl.gst_percent / 100)))}`} /><ListingPay plan="yearly" label={`Pay yearly ${rupees(Math.round(vl.yearly_fee * 100 * (1 + vl.gst_percent / 100)))}`} /></> : <ListingPay label={`Pay yearly listing ${rupees(Math.round(l.yearly_fee * 100 * (1 + l.gst_percent / 100)))}`} />}</div></div>}
    {r.status === "approved" && !listed && <p className="mt-3 rounded-xl bg-soft p-3 text-sm font-semibold text-chilli">Your listing has expired, so customers cannot see you. Pay the listing fee to go live again.</p>}
    {vendor && r.status === "approved" && <><p className="mt-4 rounded-xl bg-soft p-3 text-sm font-semibold">{t("p_vendor_note")}</p><LocationUpdate landmark={r.landmark} labels={{ title: t("loc_title"), sub: t("loc_sub"), btn: t("loc_btn"), ok: t("loc_ok") }} /></>}
    <div className="mt-6 flex flex-wrap items-center gap-3"><InstallApp label={t("install_partner")} className="btn btn-line !py-2 text-sm" /><PushButton label="Turn on order alerts on this phone" /><NewOrderAlert initial={waiting} /></div>
    <h2 className="mt-8 text-2xl">{t("p_live")} {waiting > 0 && <span className="chip ml-2 bg-chilli text-white">{waiting} {t("p_new")}</span>}</h2>
    {active.length ? <ul className="mt-3 space-y-3">{active.map((o: any) => <Card key={o.id} o={o} />)}</ul> : <p className="mt-3 text-muted">{r.is_open ? t("p_no_orders") : t("p_tap_open")}</p>}
    <div className="mt-8 flex flex-wrap gap-3"><Link href="/partner/menu" className="btn btn-dark">{t("p_manage_menu")}</Link></div>
    <details className="card mt-8 p-5"><summary className="cursor-pointer text-xl font-extrabold">Restaurant settings</summary><form action={updateRestaurant} className="mt-4 grid gap-3 sm:grid-cols-2">
      <div className="sm:col-span-2"><label className="label">One-line description</label><input name="tagline" defaultValue={r.tagline || ""} maxLength={100} className="input" /></div><div className="sm:col-span-2"><label className="label">About</label><textarea name="description" defaultValue={r.description || ""} rows={3} maxLength={600} className="input" /></div>
      <div className="sm:col-span-2"><label className="label">Cuisines (comma separated)</label><input name="cuisines" defaultValue={(r.cuisines || []).join(", ")} className="input" /></div>
      <div><label className="label">Prep time (minutes)</label><input name="prep_minutes" type="number" defaultValue={r.prep_minutes} className="input" /></div><div><label className="label">Minimum order (₹)</label><input name="min_order" type="number" defaultValue={(r.min_order_paise || 0) / 100} className="input" /></div>
      <div><label className="label">Phone</label><input name="phone" defaultValue={r.phone} className="input" /></div><div><label className="label">WhatsApp for orders</label><input name="whatsapp" defaultValue={r.whatsapp || ""} className="input" /></div>
      <div><label className="label">New logo</label><input name="logo" type="file" accept="image/*" className="input" /></div><div><label className="label">New cover photo</label><input name="cover" type="file" accept="image/*" className="input" /></div>
      <label className="flex items-center gap-2 text-sm font-semibold sm:col-span-2"><input type="checkbox" name="veg_only" defaultChecked={r.veg_only} className="h-4 w-4" /> Pure vegetarian kitchen</label><button className="btn btn-primary sm:col-span-2">Save settings</button></form></details>
    {done.length > 0 && <><h2 className="mt-10 text-2xl">Recent orders</h2><ul className="mt-3 divide-y divide-line rounded-2xl border border-line bg-white text-sm">{done.slice(0, 15).map((o: any) => <li key={o.id} className="flex justify-between p-3"><span>{o.code} · {dateFmt(o.created_at)}</span><span className="font-bold">{rupees(o.subtotal_paise)} · {STATUS_LABEL[o.status]}</span></li>)}</ul></>}</div>);
}
