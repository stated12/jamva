import { db } from "@/lib/db";
import { dayFmt } from "@/lib/format";
import { restaurantDecision } from "../actions";
export const dynamic = "force-dynamic";
export default async function Page() {
  const { data } = await db().from("restaurants").select("*, areas:jm_areas(name)").order("created_at", { ascending: false }).limit(200);
  const order = { pending: 0, approved: 1, suspended: 2, rejected: 3 } as Record<string, number>; const rs = (data || []).sort((a: any, b: any) => order[a.status] - order[b.status]);
  return (<div><h1 className="text-3xl">Restaurants</h1><ul className="mt-4 space-y-3">{rs.map((r: any) => (<li key={r.id} className="card p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-lg font-extrabold">{r.name} <span className={`chip ml-1 ${r.status === "approved" ? "bg-leaf-soft text-leaf" : r.status === "pending" ? "bg-kesar text-white" : ""}`}>{r.status}</span></p>
    <p className="text-sm text-muted">{r.areas?.name} · {r.address}</p><p className="text-sm">Owner {r.owner_name || "—"} · <a className="underline" href={`tel:${r.phone}`}>{r.phone}</a> · FSSAI <b>{r.fssai_no}</b>{r.gstin ? ` · GSTIN ${r.gstin}` : ""}</p><p className="text-xs text-muted">Applied {dayFmt(r.created_at)}{r.trial_until ? ` · Trial until ${dayFmt(r.trial_until)}` : ""}{r.listing_paid_until ? ` · Paid until ${dayFmt(r.listing_paid_until)}` : ""}</p></div>
    <form action={restaurantDecision} className="flex flex-wrap items-center gap-2"><input type="hidden" name="id" value={r.id} /><input name="note" placeholder="Note to owner (optional)" className="input !w-48 !py-2 text-sm" />{r.status !== "approved" && <button name="act" value="approve" className="btn btn-green !py-2 text-sm">Approve</button>}{r.status === "pending" && <button name="act" value="reject" className="btn btn-line !py-2 text-sm">Reject</button>}{r.status === "approved" && <button name="act" value="suspend" className="btn btn-line !py-2 text-sm">Suspend</button>}</form></div></li>))}{!rs.length && <li className="text-muted">No applications yet.</li>}</ul></div>);
}
