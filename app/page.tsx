import Link from "next/link";
import Image from "next/image";
import { listRestaurants, listAreas } from "@/lib/data";
import { getFees } from "@/lib/pricing";
import RestaurantCard from "@/components/RestaurantCard";
import BillExample from "@/components/BillExample";
import WaitlistForm from "@/components/WaitlistForm";
import { VENTURES } from "@/components/Footer";
export const dynamic = "force-dynamic";
export default async function Home({ searchParams }: { searchParams: Promise<{ w?: string }> }) {
  const sp = await searchParams;
  const [rs, areas, fees] = await Promise.all([listRestaurants({ limit: 6 }).catch(() => []), listAreas().catch(() => []), getFees()]);
  const lowest = Math.min(...fees.tiers.map((t) => t.fee));
  return (<>
    <section className="relative overflow-hidden bg-gradient-to-br from-[#FFF1D6] via-[#FFE3B8] to-[#FFD29A]">
      <div className="wrap grid items-center gap-10 py-14 md:grid-cols-2 md:py-24">
        <div className="rise"><p className="kicker">Launching in Ahmedabad</p>
          <h1 className="mt-3 text-5xl md:text-7xl">Good food,<br /><span className="text-[#7A1D11]">fair for everyone.</span></h1>
          <p className="mt-5 max-w-lg text-lg text-[#4a3d33]">Pay for the food, not the platform. Restaurants keep every rupee of their menu price because we take zero commission. You pay one honest delivery fee from ₹{lowest}. No platform fee, no packaging charge, no handling charge.</p>
          <div className="mt-7 flex flex-wrap gap-3"><Link href="/restaurants" className="btn btn-primary">Browse restaurants</Link><Link href="/partner" className="btn btn-line">List your restaurant</Link></div>
          <p className="mt-5 text-sm font-semibold text-[#6d5a48]">Cash on delivery and online payment (UPI, cards, netbanking).</p></div>
        <div className="relative rise mx-auto w-full max-w-sm"><div className="overflow-hidden rounded-[2rem] shadow-2xl"><Image src="/brand/app-phone.jpg" alt="The Jamva app: order food, restaurants near you, track your order" width={542} height={898} priority className="h-auto w-full" /></div>
          <div className="absolute -bottom-4 -left-4 rotate-[-3deg] rounded-2xl bg-white px-4 py-3 shadow-xl"><p className="text-xs font-bold text-muted">Platform fee</p><p className="font-display text-2xl text-leaf">₹0</p></div>
          <div className="absolute -right-3 top-8 rotate-[4deg] rounded-2xl bg-[#7A1D11] px-4 py-3 text-white shadow-xl"><p className="text-xs font-bold text-white/70">Restaurant commission</p><p className="font-display text-2xl">0%</p></div></div></div></section>

    <section className="wrap py-14"><div className="grid gap-8 md:grid-cols-2 md:items-center"><div><p className="kicker">Why it costs less</p><h2 className="mt-2 text-4xl">Most of what apps charge is not the food.</h2>
      <p className="mt-4 text-[#4a3d33]">On big delivery apps the price of a meal is usually lifted by commission passed into menu prices, then topped up with platform, packaging and handling charges. Jamva works differently: restaurants pay a flat yearly listing fee, so there is nothing to pass on to you.</p>
      <ul className="mt-5 space-y-2 font-semibold"><li>✓ Menu price equals the restaurant&apos;s own price</li><li>✓ One delivery fee, shown before you pay</li><li>✓ Riders paid fairly per delivery</li></ul></div><BillExample fee={3500} gstPct={fees.gst_percent} /></div></section>

    <section className="bg-soft py-14"><div className="wrap"><div className="flex items-end justify-between"><h2 className="text-4xl">{rs.length ? "Open in Ahmedabad" : "Restaurants joining now"}</h2>{rs.length > 0 && <Link href="/restaurants" className="text-sm font-extrabold hover:text-chilli">See all →</Link>}</div>
      {rs.length ? <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{rs.map((r) => <RestaurantCard key={r.id} r={r} />)}</div> : (
        <div id="waitlist" className="card mt-6 grid gap-8 p-6 md:grid-cols-2 md:p-10"><div><p className="kicker">Get first access</p><h3 className="mt-2 text-3xl">We are signing up Ahmedabad restaurants this month.</h3><p className="mt-3 text-muted">Leave your number and we will message you the day the first kitchens in your area go live. No spam, one message.</p>
          {sp.w === "ok" && <p className="mt-4 rounded-xl bg-leaf-soft p-3 font-bold text-leaf">Thank you! You are on the list.</p>}{sp.w === "bad" && <p className="mt-4 text-chilli">Please enter a valid mobile number.</p>}{sp.w === "rate" && <p className="mt-4 text-chilli">Too many attempts. Please try later.</p>}</div>
          <WaitlistForm areas={areas} /></div>)}</div></section>

    <section className="wrap py-14"><div className="grid gap-8 md:grid-cols-2 md:items-center"><div><p className="kicker">New: Street Vendors</p><h2 className="mt-2 text-4xl">Manek Chowk to Law Garden. Your favourite carts, on one live map.</h2><p className="mt-4 text-[#4a3d33]">Street vendors list on Jamva free for 90 days, keep 100% of their food price and switch Open or Closed with one tap. They show on the map only while open, with a live pin and a landmark.</p>
      <div className="mt-5 flex flex-wrap gap-3"><Link href="/street-vendors" className="btn btn-primary">See street vendors open now</Link><Link href="/street-vendors/join" className="btn btn-line">Join as Street Vendor</Link></div></div>
      <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-1 lg:grid-cols-3">{[["/partner/register", "List your restaurant", "90 days free"], ["/street-vendors/join", "Join as Street Vendor", "2-minute signup"], ["/driver/register", "Ride with us", "Fair pay per delivery"]].map(([h, t, d]) => <Link key={h} href={h} className="card block p-4 transition hover:-translate-y-1 hover:shadow-xl"><p className="font-extrabold">{t}</p><p className="text-sm text-muted">{d}</p></Link>)}</div></div></section>

    <section className="wrap py-14"><p className="kicker">How it works</p><h2 className="mt-2 text-4xl">Three steps, no surprises</h2>
      <div className="mt-8 grid gap-5 md:grid-cols-3">{[["1", "Choose a restaurant", "Browse kitchens near you. Menu prices are exactly what the restaurant charges."], ["2", "See the full bill", "Food, one delivery fee and GST on that fee. Nothing is added later."], ["3", "Track to your door", "Live status from kitchen to doorstep, with alerts on your phone."]].map(([n, t, d]) => (<div key={n} className="card p-6"><span className="font-display text-5xl text-kesar">{n}</span><h3 className="mt-2 text-2xl">{t}</h3><p className="mt-2 text-muted">{d}</p></div>))}</div></section>

    <section className="bg-ink py-14 text-white"><div className="wrap grid gap-8 md:grid-cols-2 md:items-center"><div><p className="kicker !text-kesar">For restaurant owners</p><h2 className="mt-2 text-4xl">Keep your margin. Pay once a year.</h2>
      <p className="mt-4 text-white/75">A flat yearly listing fee instead of 20 to 30 percent of every order. Your first {90} days are free. Menu, orders and open or closed switch on your phone, with a new-order alert.</p><div className="mt-6 flex gap-3"><Link href="/partner" className="btn btn-primary">See pricing</Link><Link href="/partner/register" className="btn border-white text-white hover:bg-white hover:text-ink">Join free</Link></div></div>
      <div className="grid grid-cols-3 gap-3 text-center"><div className="rounded-2xl bg-white/10 p-5"><p className="font-display text-4xl text-kesar">0%</p><p className="text-sm text-white/70">commission</p></div><div className="rounded-2xl bg-white/10 p-5"><p className="font-display text-4xl text-kesar">1</p><p className="text-sm text-white/70">yearly fee</p></div><div className="rounded-2xl bg-white/10 p-5"><p className="font-display text-4xl text-kesar">90</p><p className="text-sm text-white/70">days free</p></div></div></div></section>

    <section className="wrap py-14"><div className="card grid gap-8 p-6 md:grid-cols-3 md:p-10"><div className="md:col-span-1"><Image src="/founder/avdhesh-kumbhar.jpg" alt="Avdhesh Kumbhar, founder of Jamva" width={400} height={500} className="aspect-[4/5] w-full rounded-2xl object-cover" /></div>
      <div className="md:col-span-2"><p className="kicker">Founder</p><h2 className="mt-2 text-4xl">Avdhesh Kumbhar</h2><p className="mt-1 font-semibold text-muted">Founder, ORIVANA Global Foundation</p>
        <p className="mt-4 text-[#4a3d33]">Jamva is built on a simple idea: a meal should cost what the restaurant charges plus a fair delivery fee, and the people who cook and ride should earn properly. It comes from a family of ventures built around trust, accountability and community.</p>
        <ul className="mt-5 grid gap-2 sm:grid-cols-2">{VENTURES.map((v) => (<li key={v.name}><a href={v.url} target="_blank" rel="noopener noreferrer" className="block rounded-xl border border-line p-3 hover:border-kesar"><b>{v.name}</b><br /><span className="text-xs text-muted">{v.line}</span></a></li>))}</ul><Link href="/about" className="mt-5 inline-block text-sm font-extrabold text-chilli">Read the full profile →</Link></div></div></section>
  </>);
}
