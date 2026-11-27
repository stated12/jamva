import { BIZ } from "@/lib/biz";
export default function Legal({ title, children }: { title: string; children: React.ReactNode }) {
  return (<div className="wrap max-w-3xl py-12"><p className="kicker">Jamva policies</p><h1 className="mt-2 text-4xl md:text-5xl">{title}</h1><p className="mt-2 text-sm text-muted">Last updated {BIZ.updated}. Operated by {BIZ.legal}.</p><div className="prose-legal mt-6">{children}</div>
    <p className="mt-10 rounded-xl bg-soft p-4 text-sm">Questions? Email <a className="font-bold underline" href={`mailto:${BIZ.email}`}>{BIZ.email}</a>. Registered address: {BIZ.address}.</p></div>);
}
