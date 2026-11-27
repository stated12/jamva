import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { rupees, dateFmt, STATUS_LABEL } from "@/lib/format";
import Timeline from "@/components/Timeline";
import AutoRefresh from "@/components/AutoRefresh";
import PushButton from "@/components/PushButton";
export const metadata = { title: "Your order" };
export const dynamic = "force-dynamic";
export default async function Page({ params, searchParams }: { params: Promise<{ code: string }>; searchParams: Promise<{ paid?: string }> }) {
  const { code } = await params; const sp = await searchParams; const p = await requireUser(`/order/${code}`);
  const { data: o } = await db().from("orders").select("*, restaurants:jm_restaurants(name,slug,phone,address)").eq("code", code).eq("customer_id", p.id).maybeSingle(); if (!o) notFound();
  const { data: items } = await db().from("order_items").select("*").eq("order_id", o.id);
  const live = !["delivered", "cancelled", "rejected"].includes(o.status); const dead = o.status === "cancelled" || o.status === "rejected";
  return (<div className="wrap max-w-2xl py-10">{live && <AutoRefresh />}
    <p className="kicker">Order {o.code}</p><h1 className="text-4xl">{STATUS_LABEL[o.status] || o.status}</h1><p className="mt-1 text-muted">{o.restaurants?.name} · {dateFmt(o.created_at)}</p>
    {sp.paid && o.status === "pending_payment" && <p className="mt-4 rounded-xl bg-soft p-3 text-sm font-semibold">We are confirming your payment. This page updates by itself.</p>}
    {o.status === "pending_payment" && !sp.paid && <p className="mt-4 rounded-xl bg-soft p-3 text-sm font-semibold">Payment was not completed. Place the order again from the restaurant page.</p>}
    {dead && <p className="mt-4 rounded-xl bg-soft p-3 text-sm font-semibold text-chilli">{o.status === "rejected" ? "The restaurant could not accept this order." : "This order was cancelled."} {o.payment_status === "paid" || o.payment_status === "refund_due" ? "Your online payment will be refunded to the original payment method within 5 to 7 working days." : o.payment_status === "refunded" ? "Your payment has been refunded." : ""}</p>}
    {!dead && o.status !== "pending_payment" && <div className="card mt-6 p-5"><Timeline status={o.status} />{o.eta_minutes && live && <p className="mt-4 text-sm text-muted">Estimated about {o.eta_minutes + 10}–{o.eta_minutes + 25} minutes in total.</p>}</div>}
    {live && <div className="mt-4"><PushButton label="Get alerts when my order moves" /></div>}
    <div className="card mt-6 p-5 text-sm"><h2 className="text-2xl">Bill</h2><ul className="mt-3 space-y-1">{(items || []).map((i: any) => <li key={i.id} className="flex justify-between"><span>{i.qty} × {i.name}</span><span>{rupees(i.price_paise * i.qty)}</span></li>)}</ul>
      <dl className="mt-3 space-y-1 border-t border-line pt-3"><div className="flex justify-between"><dt>Delivery fee</dt><dd>{rupees(o.delivery_fee_paise)}</dd></div><div className="flex justify-between"><dt>GST on delivery</dt><dd>{rupees(o.delivery_gst_paise)}</dd></div><div className="flex justify-between"><dt>Platform, packaging, handling</dt><dd className="text-leaf">₹0</dd></div><div className="flex justify-between text-base font-extrabold"><dt>Total {o.payment_method === "cod" ? "(cash on delivery)" : o.payment_status === "paid" ? "(paid)" : ""}</dt><dd>{rupees(o.total_paise)}</dd></div></dl></div>
    <div className="card mt-4 p-5 text-sm"><p className="font-bold">Delivering to</p><p>{o.address?.line1}{o.address?.landmark ? `, ${o.address.landmark}` : ""}, {o.address?.area}</p>{o.restaurants?.phone && <p className="mt-3">Questions about the food? <a className="font-bold text-chilli" href={`tel:${o.restaurants.phone}`}>Call {o.restaurants.name}</a></p>}</div>
    <Link href="/orders" className="mt-6 inline-block text-sm font-extrabold text-chilli">← All my orders</Link></div>);
}
