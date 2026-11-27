import { BIZ } from "@/lib/biz";
import { sendContact } from "../actions";
export const metadata = { title: "Contact us" };
export default async function Page({ searchParams }: { searchParams: Promise<{ ok?: string; e?: string }> }) {
  const sp = await searchParams;
  return (<div className="wrap max-w-3xl py-12"><h1 className="text-4xl md:text-5xl">Contact Jamva</h1><div className="mt-6 grid gap-6 md:grid-cols-2"><div className="card p-5 text-sm"><p className="font-bold">{BIZ.legal}</p><p className="mt-2">{BIZ.address}</p><p className="mt-3">Email: <a className="font-bold underline" href={`mailto:${BIZ.email}`}>{BIZ.email}</a></p><p>Phone: {BIZ.phone}</p><p className="mt-3 text-muted">Support hours: 10 am to 10 pm, every day. We reply to emails within one working day.</p></div>
    <form action={sendContact} className="card space-y-3 p-5">{sp.ok && <p className="rounded-xl bg-leaf-soft p-3 text-sm font-semibold text-leaf">Thanks, we will get back to you.</p>}{sp.e && <p className="rounded-xl bg-soft p-3 text-sm font-semibold text-chilli">Please write a message and try again.</p>}
      <input name="name" placeholder="Your name" className="input" /><input name="email" type="email" placeholder="Email" className="input" /><input name="phone" placeholder="Mobile (optional)" className="input" /><textarea name="message" required rows={4} placeholder="How can we help? Include your order number if it is about an order." className="input" /><button className="btn btn-primary w-full">Send</button></form></div></div>);
}
