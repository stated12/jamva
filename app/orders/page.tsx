import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { rupees, dateFmt, STATUS_LABEL } from "@/lib/format";
export const metadata = { title: "My orders" };
export const dynamic = "force-dynamic";
export default async function Page() {
  const p = await requireUser("/orders"); const { data } = await db().from("orders").select("code,status,total_paise,created_at,restaurants:jm_restaurants(name)").eq("customer_id", p.id).neq("status", "pending_payment").order("created_at", { ascending: false }).limit(50);
  return (<div className="wrap max-w-2xl py-10"><h1 className="text-4xl">My orders</h1>{(data || []).length === 0 ? <div className="card mt-6 p-8 text-center"><p className="text-muted">No orders yet.</p><Link href="/restaurants" className="btn btn-primary mt-4">Browse restaurants</Link></div> :
    <ul className="mt-6 space-y-3">{(data || []).map((o: any) => (<li key={o.code}><Link href={`/order/${o.code}`} className="card flex items-center justify-between p-4 hover:border-kesar"><div><p className="font-bold">{o.restaurants?.name}</p><p className="text-sm text-muted">{o.code} · {dateFmt(o.created_at)}</p></div><div className="text-right"><p className="font-bold">{rupees(o.total_paise)}</p><p className="text-xs font-bold text-leaf">{STATUS_LABEL[o.status]}</p></div></Link></li>))}</ul>}</div>);
}
