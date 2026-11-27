import Link from "next/link";
import { listRestaurants } from "@/lib/data";
import { getVendorListing } from "@/lib/pricing";
import RestaurantCard from "@/components/RestaurantCard";
import VendorMap from "@/components/VendorMap";
import InstallApp from "@/components/InstallApp";
export const metadata = { title: "Street vendors on Jamva", description: "Ahmedabad's street food, live on a map. Vendors list free for 90 days, keep 100% of their food price and open or close with one tap.", manifest: "/partner.webmanifest" };
export const dynamic = "force-dynamic";
export default async function Page() {
  const [open, v] = await Promise.all([listRestaurants({ kind: "street", limit: 100 }).catch(() => []), getVendorListing()]);
  const pins = open.filter((r: any) => r.lat && r.lng).map((r: any) => ({ slug: r.slug, name: r.name, lat: r.lat, lng: r.lng, landmark: r.landmark, area: r.areas?.name }));
  const perks: [string, string][] = [["Zero commission", "Keep 100% of your food price. Always."], ["One-tap Open / Closed", "You appear on the live map only while Open, and vanish when Closed. Perfect for evening and night carts."], ["Live GPS pin + landmark", "Moved your cart? Update the pin in one tap and add a landmark like Opposite Gate 2."], ["Out of stock in one tap", "Sold out of pav? Switch that dish off instantly. Add combos to make delivery orders worthwhile."], ["FSSAI help", "We guide you through the Basic FSSAI registration (about ₹100 a year) during onboarding."], ["Simple pricing", `First ${v.trial_days} days free. Then ₹${v.monthly_fee} a month or ₹${v.yearly_fee} a year, plus GST. No other charges.`]];
  return (<div><section className="bg-gradient-to-br from-[#FFF1D6] to-[#FFD29A]"><div className="wrap py-14"><p className="kicker">Street vendors and food carts</p><h1 className="mt-2 max-w-2xl text-4xl md:text-6xl">Ahmedabad&apos;s street food, delivered. Your cart, your rules.</h1><p className="mt-4 max-w-xl text-ink/80">From Manek Chowk to Law Garden and HL College Road. Join in two minutes from your phone.</p>
    <div className="mt-6 flex flex-wrap items-center gap-3"><Link href="/street-vendors/join" className="btn btn-primary">Join as Street Vendor</Link><InstallApp label="Install Jamva Partner App" className="btn btn-dark" /></div></div></section>
    <section className="wrap py-12"><h2 className="text-3xl md:text-4xl">Open now on the map</h2><p className="mt-1 text-muted">Only carts that are open right now are shown.</p><div className="mt-4"><VendorMap pins={pins} /></div>
      {open.length ? <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{open.map((r: any) => <RestaurantCard key={r.id} r={r} />)}</div> : <p className="card mt-6 p-6 text-center text-muted">No street vendors are open right now. The first ones are joining soon. Are you one? <Link href="/street-vendors/join" className="font-extrabold text-chilli">Join free</Link>.</p>}</section>
    <section className="bg-soft py-12"><div className="wrap"><h2 className="text-3xl md:text-4xl">Why vendors choose Jamva</h2><div className="mt-6 grid gap-4 md:grid-cols-3">{perks.map(([t, d]) => <div key={t} className="card p-5"><h3 className="text-xl">{t}</h3><p className="mt-1 text-sm text-muted">{d}</p></div>)}</div>
      <div className="mt-8 flex flex-wrap items-center gap-3"><Link href="/street-vendors/join" className="btn btn-primary">Join free for {v.trial_days} days</Link><Link href="/partner" className="btn btn-line">I run a restaurant</Link></div><p className="mt-4 text-sm text-muted">Help: support@jamva.in</p></div></section></div>);
}
