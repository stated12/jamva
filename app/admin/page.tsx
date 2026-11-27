import Link from "next/link";
import { db } from "@/lib/db";
import { rupees, dateFmt } from "@/lib/format";
export const dynamic = "force-dynamic";
const count = async (t: string, f?: (q: any) => any) => { let q = db().from(t).select("id", { count: "exact", head: true }); if (f) q = f(q); const { count } = await q; return count || 0; };
export default async function Page() {
  const [pend, appr, orders, wl, wr, wd, paid] = await Promise.all([count("restaurants", (q) => q.eq("status", "pending")), count("restaurants", (q) => q.eq("status", "approved")), count("orders", (q) => q.neq("status", "pending_payment")), count("waitlist", (q) => q.eq("kind", "customer")), count("waitlist", (q) => q.eq("kind", "restaurant")), count("waitlist", (q) => q.eq("kind", "driver")),
    db().from("orders").select("total_paise").eq("payment_status", "paid")]);
  const revenue = ((paid as any).data || []).reduce((s: number, o: any) => s + o.total_paise, 0);
  const { data: msgs } = await db().from("contact_messages").select("*").order("created_at", { ascending: false }).limit(8);
  const { data: wait } = await db().from("waitlist").select("*").order("created_at", { ascending: false }).limit(10);
  const tiles: [string, string | number, string?][] = [["Applications to review", pend, "/admin/restaurants"], ["Live restaurants", appr], ["Orders (all time)", orders, "/admin/orders"], ["Online sales processed", rupees(revenue)], ["Customer waitlist", wl], ["Restaurant leads", wr], ["Rider leads", wd]];
  return (<div><div className="grid grid-cols-2 gap-3 md:grid-cols-4">{tiles.map(([l, v, h]) => { const C: any = h ? Link : "div"; return <C key={l} {...(h ? { href: h } : {})} className="card p-4"><p className="text-xs font-bold text-muted">{l}</p><p className="font-display text-3xl">{v}</p></C>; })}</div>
    <div className="mt-8 grid gap-6 md:grid-cols-2"><section><h2 className="text-2xl">Latest sign-ups to the waitlist</h2><ul className="card mt-3 divide-y divide-line text-sm">{(wait || []).map((w: any) => <li key={w.id} className="p-3"><b>{w.name || "—"}</b> · {w.phone || w.email} · <span className="chip">{w.kind}</span> {w.area_slug && <span className="text-muted">{w.area_slug}</span>}</li>)}{!(wait || []).length && <li className="p-3 text-muted">None yet.</li>}</ul></section>
      <section><h2 className="text-2xl">Contact messages</h2><ul className="card mt-3 divide-y divide-line text-sm">{(msgs || []).map((m: any) => <li key={m.id} className="p-3"><b>{m.name || "—"}</b> · {m.email || m.phone} · <span className="text-muted">{dateFmt(m.created_at)}</span><p>{m.message}</p></li>)}{!(msgs || []).length && <li className="p-3 text-muted">None yet.</li>}</ul></section></div></div>);
}
