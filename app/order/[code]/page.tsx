import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { rupees, dateFmt, STATUS_LABEL } from "@/lib/format";
import Timeline from "@/components/Timeline";
import RealtimeRefresh from "@/components/RealtimeRefresh";
import LiveRiderMap from "@/components/LiveRiderMap";
import PushButton from "@/components/PushButton";
import { getT } from "@/lib/i18n";
export const metadata = { title: "Your order" };
export const dynamic = "force-dynamic";
export default async function Page({ params, searchParams }: { params: Promise<{ code: string }>; searchParams: Promise<{ paid?: string }> }) {
  const { code } = await params; const sp = await searchParams; const { t } = await getT(); const p = await requireUser(`/order/${code}`);
  const { data: o } = await db().from("orders").select("*, restaurants:jm_restaurants(name,slug,phone,address,lat,lng), drivers:jm_drivers(name,phone,vehicle)").eq("code", code).eq("customer_id", p.id).maybeSingle(); if (!o) notFound();
  const { data: items } = await db().from("order_items").select("*").eq("order_id", o.id);
  const live = !["delivered", "cancelled", "rejected"].includes(o.status); const dead = o.status === "cancelled" || o.status === "rejected";
  return (<div className="wrap max-w-2xl py-10">{live && <RealtimeRefresh subs={[{ table: "jm_orders", filter: `id=eq.${o.id}` }]} fast={15000} slow={90000} labels={{ live: t("rt_live"), reconnecting: t("rt_reconnecting") }} />}
    <p className="kicker">Order {o.code}</p><h1 className="text-4xl">{STATUS_LABEL[o.status] ? t("st_" + o.status) : o.status}</h1><p className="mt-1 text-muted">{o.restaurants?.name} · {dateFmt(o.created_at)}</p>
    {sp.paid && o.status === "pending_payment" && <p className="mt-4 rounded-xl bg-soft p-3 text-sm font-semibold">We are confirming your payment. This page updates by itself.</p>}
    {o.status === "pending_payment" && !sp.paid && <p className="mt-4 rounded-xl bg-soft p-3 text-sm font-semibold">Payment was not completed. Place the order again from the restaurant page.</p>}
    {dead && <p className="mt-4 rounded-xl bg-soft p-3 text-sm font-semibold text-chilli">{o.status === "rejected" ? "The restaurant could not accept this order." : "This order was cancelled."} {o.payment_status === "paid" || o.payment_status === "refund_due" ? "Your online payment will be refunded to the original payment method within 5 to 7 working days." : o.payment_status === "refunded" ? "Your payment has been refunded." : ""}</p>}
    {!dead && o.status !== "pending_payment" && <div className="card mt-6 p-5"><Timeline status={o.status} labels={{ placed: t("st_placed"), accepted: t("st_accepted"), preparing: t("st_preparing"), ready: t("st_ready"), picked_up: t("st_picked_up"), delivered: t("st_delivered") }} />{o.eta_minutes && live && <p className="mt-4 text-sm text-muted">Estimated about {o.eta_minutes + 10}–{o.eta_minutes + 25} minutes in total.</p>}</div>}
    {live && o.drivers && ["accepted", "preparing", "ready", "picked_up"].includes(o.status) && <div className="card mt-4 flex items-center justify-between gap-3 p-4 text-sm"><div><p className="font-bold">{t("your_rider")}: {o.drivers.name}</p><p className="text-muted">{o.status === "picked_up" ? "On the way to you" : "Heading to the restaurant"}{o.drivers.vehicle ? ` · ${o.drivers.vehicle}` : ""}</p></div><a href={`tel:${o.drivers.phone}`} className="btn btn-dark !py-2 text-sm">{t("call_rider")}</a></div>}
    {live && o.driver_id && ["ready", "picked_up"].includes(o.status) && <LiveRiderMap orderId={o.id} dest={o.address?.lat && o.address?.lng ? { lat: o.address.lat, lng: o.address.lng } : null} shop={o.restaurants?.lat && o.restaurants?.lng ? { lat: o.restaurants.lat, lng: o.restaurants.lng } : null} labels={{ title: t("map_title"), waiting: t("map_waiting"), updated: t("map_updated"), paused: t("map_paused") }} />}
    {live && <div className="mt-4"><PushButton label="Get alerts when my order moves" /></div>}
    <div className="card mt-6 p-5 text-sm"><h2 className="text-2xl">Bill</h2><ul className="mt-3 space-y-1">{(items || []).map((i: any) => <li key={i.id} className="flex justify-between"><span>{i.qty} × {i.name}</span><span>{rupees(i.price_paise * i.qty)}</span></li>)}</ul>
      <dl className="mt-3 space-y-1 border-t border-line pt-3"><div className="flex justify-between"><dt>Delivery fee</dt><dd>{rupees(o.delivery_fee_paise)}</dd></div><div className="flex justify-between"><dt>GST on delivery</dt><dd>{rupees(o.delivery_gst_paise)}</dd></div><div className="flex justify-between"><dt>Platform, packaging, handling</dt><dd className="text-leaf">₹0</dd></div><div className="flex justify-between text-base font-extrabold"><dt>Total {o.payment_method === "cod" ? "(cash on delivery)" : o.payment_status === "paid" ? "(paid)" : ""}</dt><dd>{rupees(o.total_paise)}</dd></div></dl></div>
    <div className="card mt-4 p-5 text-sm"><p className="font-bold">Delivering to</p><p>{o.address?.line1}{o.address?.landmark ? `, ${o.address.landmark}` : ""}, {o.address?.area}</p>{o.restaurants?.phone && <p className="mt-3">Questions about the food? <a className="font-bold text-chilli" href={`tel:${o.restaurants.phone}`}>Call {o.restaurants.name}</a></p>}</div>
    <Link href="/orders" className="mt-6 inline-block text-sm font-extrabold text-chilli">← All my orders</Link></div>);
}
