"use client";
import Link from "next/link";
import { useCart } from "@/components/Cart";
import { rupees } from "@/lib/format";
export type CartLabels = { empty: string; pick: string; browse: string; from: string; items: string; fees: string; next: string; go: string; clear: string };
export default function CartView({ L }: { L: CartLabels }) {
  const { lines, subtotal, slug, name, setQty, clear } = useCart();
  if (!lines.length) return (<div className="wrap py-20 text-center"><h1 className="text-4xl">{L.empty}</h1><p className="mt-2 text-muted">{L.pick}</p><Link href="/restaurants" className="btn btn-primary mt-6">{L.browse}</Link></div>);
  return (<div className="wrap max-w-2xl py-10"><p className="kicker">{L.from}</p><h1 className="text-4xl"><Link href={`/r/${slug}`} className="hover:text-chilli">{name}</Link></h1>
    <ul className="card mt-6 divide-y divide-line">{lines.map((l) => (<li key={l.id} className="flex items-center gap-3 p-4"><span className={l.veg ? "veg" : "nonveg"} /><div className="flex-1"><p className="font-bold">{l.name}</p><p className="text-sm text-muted">{rupees(l.price)}</p></div>
      <div className="inline-flex items-center gap-3 rounded-full border border-line px-2 py-1"><button aria-label="Less" onClick={() => setQty(l.id, l.qty - 1)} className="h-7 w-7 text-xl font-bold">−</button><span className="w-5 text-center font-bold">{l.qty}</span><button aria-label="More" onClick={() => setQty(l.id, l.qty + 1)} className="h-7 w-7 text-xl font-bold">+</button></div><p className="w-20 text-right font-bold">{rupees(l.price * l.qty)}</p></li>))}</ul>
    <div className="card mt-4 p-4 text-sm"><div className="flex justify-between"><span>{L.items}</span><b>{rupees(subtotal)}</b></div><div className="mt-1 flex justify-between text-leaf"><span>{L.fees}</span><b>₹0</b></div><p className="mt-2 text-muted">{L.next}</p></div>
    <div className="mt-6 flex gap-3"><Link href="/checkout" className="btn btn-primary flex-1">{L.go}</Link><button onClick={clear} className="btn btn-line">{L.clear}</button></div></div>);
}
