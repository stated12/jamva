import { db } from "@/lib/db";
import { rupees, dateFmt, STATUS_LABEL } from "@/lib/format";
import { adminOrderAction } from "../actions";
export const dynamic = "force-dynamic";
export default async function Page() {
  const { data } = await db().from("orders").select("*, restaurants:jm_restaurants(name)").neq("status", "pending_payment").order("created_at", { ascending: false }).limit(100);
  return (<div><h1 className="text-3xl">Orders</h1><ul className="mt-4 space-y-3">{(data || []).map((o: any) => (<li key={o.id} className="card p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-extrabold">{o.code} · {o.restaurants?.name} <span className="chip ml-1">{STATUS_LABEL[o.status]}</span></p><p className="text-sm text-muted">{dateFmt(o.created_at)} · {o.customer_name} · {o.customer_phone} · {o.address?.area}</p><p className="text-sm">{rupees(o.total_paise)} · {o.payment_method === "cod" ? "COD" : "Online"} · payment: <b>{o.payment_status}</b></p></div>
    <form action={adminOrderAction} className="flex flex-wrap gap-2"><input type="hidden" name="id" value={o.id} />{o.status === "ready" && <button name="act" value="picked_up" className="btn btn-dark !py-2 text-sm">Picked up</button>}{o.status === "picked_up" && <button name="act" value="delivered" className="btn btn-green !py-2 text-sm">Delivered</button>}{!["delivered", "cancelled", "rejected"].includes(o.status) && <button name="act" value="cancelled" className="btn btn-line !py-2 text-sm">Cancel</button>}{o.payment_status === "refund_due" && <button name="act" value="refund" className="btn btn-primary !py-2 text-sm">Retry refund</button>}</form></div></li>))}{!(data || []).length && <li className="text-muted">No orders yet.</li>}</ul></div>);
}
