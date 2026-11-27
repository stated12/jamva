import { db } from "@/lib/db";
import { driverBalance } from "@/lib/drivers";
import { rupees, dateFmt } from "@/lib/format";
import { driverDecision, driverLedgerEntry } from "../actions";
export const dynamic = "force-dynamic";
export default async function Page() {
  const { data } = await db().from("drivers").select("*, areas:jm_areas(name)").order("created_at", { ascending: false }).limit(200);
  const list: any[] = data || [];
  const bal = await Promise.all(list.map((d) => (d.status === "active" ? driverBalance(d.id) : Promise.resolve(null))));
  const order = { pending: 0, active: 1, blocked: 2 } as Record<string, number>;
  const rows = list.map((d, i) => ({ d, b: bal[i] })).sort((x, y) => (order[x.d.status] ?? 3) - (order[y.d.status] ?? 3));
  return (<div><h1 className="text-3xl">Riders</h1><ul className="mt-4 space-y-3">{rows.map(({ d, b }) => (<li key={d.id} className="card p-4">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-extrabold">{d.name} <span className="chip ml-1">{d.status}</span>{d.is_online && <span className="chip ml-1 bg-leaf-soft text-leaf">online</span>}</p>
      <p className="text-sm text-muted">{d.phone} · {d.vehicle} {d.vehicle_no} · licence {d.licence_no || "—"} · {d.areas?.name || "—"} · applied {dateFmt(d.created_at)}</p><p className="text-sm text-muted">UPI {d.upi_id || "—"} · bank {d.bank_account ? `${d.bank_account} (${d.bank_ifsc || ""})` : "—"}</p></div>
      <form action={driverDecision} className="flex flex-wrap items-center gap-2"><input type="hidden" name="id" value={d.id} /><input name="note" placeholder="Note to rider (optional)" className="input !w-48 !py-2 text-sm" />
        {d.status !== "active" && <button name="act" value="approve" className="btn btn-green !py-2 text-sm">Approve</button>}{d.status !== "blocked" && <button name="act" value="block" className="btn btn-line !py-2 text-sm">{d.status === "pending" ? "Reject" : "Block"}</button>}</form></div>
    {b && <div className="mt-3 border-t border-line pt-3 text-sm"><p>{b.deliveries} deliveries · earned {rupees(b.earned)} · paid {rupees(b.paid)} · <b>to pay {rupees(b.payable)}</b> · cash with rider <b className={b.cashHeld > 0 ? "text-chilli" : ""}>{rupees(b.cashHeld)}</b></p>
      <form action={driverLedgerEntry} className="mt-2 flex flex-wrap gap-2"><input type="hidden" name="id" value={d.id} /><select name="kind" className="input !w-44 !py-2 text-sm"><option value="payout">Payout made (₹)</option><option value="cash_deposit">Cash received (₹)</option></select><input name="amount" type="number" step="0.01" min="1" required placeholder="Amount ₹" className="input !w-32 !py-2 text-sm" /><input name="note" placeholder="Reference / note" className="input !w-48 !py-2 text-sm" /><button className="btn btn-dark !py-2 text-sm">Record</button></form></div>}</li>))}{!rows.length && <li className="text-muted">No rider applications yet.</li>}</ul></div>);
}
