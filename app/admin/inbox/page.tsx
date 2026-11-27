import { db } from "@/lib/db";
import { dateFmt } from "@/lib/format";
export const dynamic = "force-dynamic";
export default async function Page() {
  const { data } = await db().from("contact_messages").select("*").order("created_at", { ascending: false }).limit(200);
  return (<div><h1 className="text-3xl">Support inbox</h1><p className="mt-1 text-sm text-muted">Messages from the Contact form. Replies go from support@jamva.in.</p>
    <ul className="mt-4 space-y-3">{(data || []).map((m: any) => (<li key={m.id} className="card p-4"><p className="font-extrabold">{m.name || "—"} <span className="text-sm font-normal text-muted">{dateFmt(m.created_at)}</span></p><p className="text-sm">{m.email && <a className="underline" href={`mailto:${m.email}?subject=Re: your message to Jamva`}>{m.email}</a>}{m.phone && <> · <a className="underline" href={`tel:${m.phone}`}>{m.phone}</a></>}</p><p className="mt-2 whitespace-pre-wrap text-sm">{m.message}</p></li>))}{!(data || []).length && <li className="text-muted">No messages yet.</li>}</ul></div>);
}
