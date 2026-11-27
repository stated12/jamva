import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getRestaurant } from "@/lib/data";
import { rupees } from "@/lib/format";
import Art from "@/components/Art";
import AddToCart from "@/components/AddToCart";
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const d = await getRestaurant((await params).slug); if (!d) return {};
  return { title: `${d.r.name}, ${d.r.areas?.name || "Ahmedabad"}`, description: d.r.tagline || d.r.description || `Order from ${d.r.name} on Jamva with zero platform fee.`, openGraph: { images: d.r.cover_url ? [d.r.cover_url] : ["/og.png"] } };
}
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const d = await getRestaurant((await params).slug); if (!d) notFound(); const { r, cats, items } = d;
  const groups = [...cats.map((c: any) => ({ id: c.id, name: c.name, items: items.filter((i: any) => i.category_id === c.id) })), { id: "other", name: "More", items: items.filter((i: any) => !i.category_id) }].filter((g) => g.items.length);
  const ld = { "@context": "https://schema.org", "@type": "Restaurant", name: r.name, servesCuisine: r.cuisines, address: { "@type": "PostalAddress", streetAddress: r.address, addressLocality: "Ahmedabad", addressRegion: "Gujarat", addressCountry: "IN" }, image: r.cover_url || undefined };
  return (<div>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
    <div className="relative h-52 overflow-hidden bg-soft md:h-72">{r.cover_url ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={r.cover_url} alt="" className="h-full w-full object-cover" /> : <Art seed={r.slug} kind="cover" className="h-full w-full" />}</div>
    <div className="wrap -mt-10 pb-6"><div className="card relative p-5 md:p-7"><div className="flex items-start gap-4">{r.logo_url && /* eslint-disable-next-line @next/next/no-img-element */ <img src={r.logo_url} alt="" className="h-16 w-16 rounded-2xl border border-line object-cover" />}
      <div className="flex-1"><h1 className="text-3xl md:text-4xl">{r.name}</h1><p className="mt-1 text-muted">{(r.cuisines || []).join(" · ")}</p>{r.tagline && <p className="mt-1 text-sm">{r.tagline}</p>}</div><span className={`chip ${r.is_open ? "bg-leaf text-white" : "bg-soft text-muted"}`}>{r.is_open ? "Open now" : "Closed"}</span></div>
      <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold"><span className="chip">{r.areas?.name}</span><span className="chip">{r.prep_minutes}+ min prep</span>{r.min_order_paise > 0 && <span className="chip">Min order {rupees(r.min_order_paise)}</span>}{r.veg_only && <span className="chip bg-leaf-soft text-leaf">Pure veg</span>}<span className="chip bg-leaf-soft text-leaf">Zero platform fee</span>{r.fssai_no && <span className="chip">FSSAI {r.fssai_no}</span>}</div>
      {!r.is_open && <p className="mt-4 rounded-xl bg-soft p-3 text-sm font-semibold">This restaurant is closed right now. You can look at the menu and come back when it opens.</p>}</div>
      <div className="mt-8 space-y-10 pb-24">{groups.length === 0 && <p className="text-muted">The menu is being added.</p>}{groups.map((g) => (<section key={g.id}><h2 className="text-2xl">{g.name}</h2><ul className="mt-3 divide-y divide-line rounded-2xl border border-line bg-white">{g.items.map((i: any) => (
        <li key={i.id} className={`flex gap-4 p-4 ${i.is_available ? "" : "opacity-50"}`}><div className="min-w-0 flex-1"><span className={i.is_veg ? "veg" : "nonveg"} aria-label={i.is_veg ? "Veg" : "Non-veg"} /><h3 className="mt-1 font-sans text-base font-bold tracking-normal">{i.name}</h3><p className="text-sm font-semibold">{rupees(i.price_paise)}</p>{i.description && <p className="mt-1 text-sm text-muted">{i.description}</p>}</div>
          <div className="flex w-28 shrink-0 flex-col items-center gap-2">{i.image_url ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={i.image_url} alt="" loading="lazy" className="h-24 w-28 rounded-xl object-cover" /> : <div className="h-24 w-28 overflow-hidden rounded-xl"><Art seed={i.id} className="h-full w-full" /></div>}
            {i.is_available ? <AddToCart slug={r.slug} rname={r.name} item={{ id: i.id, name: i.name, price: i.price_paise, veg: i.is_veg }} open={r.is_open} /> : <span className="text-xs font-bold text-muted">Unavailable</span>}</div></li>))}</ul></section>))}</div></div></div>);
}
