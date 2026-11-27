import Link from "next/link";
import { getDriverCfg } from "@/lib/drivers";
import { getFees } from "@/lib/pricing";
import { rupees } from "@/lib/format";
export const metadata = { title: "Ride with Jamva", description: "Deliver with Jamva in Ahmedabad. Fair per-delivery pay shown before you accept, weekly payouts." };
export const dynamic = "force-dynamic";
export default async function Page() {
  const [cfg, fees] = await Promise.all([getDriverCfg(), getFees()]);
  const lo = fees.tiers[0]?.fee || 0, hi = fees.tiers[fees.tiers.length - 1]?.fee || 0;
  const pay = (f: number) => rupees(Math.max(cfg.min_pay * 100, Math.round(f * 100 * cfg.pay_percent / 100)));
  return (<div><section className="bg-ink text-white"><div className="wrap py-16"><p className="kicker !text-kesar">Delivery partners</p><h1 className="mt-3 max-w-2xl text-5xl">Deliver with Jamva. Earn fairly.</h1><p className="mt-4 max-w-xl text-white/75">Customers pay one clear delivery fee and {cfg.pay_percent}% of it (before GST) goes to the rider. You see your pay before you accept each delivery.</p>
    <div className="mt-6 flex flex-wrap gap-3"><Link href="/driver/register" className="btn btn-primary">Become a rider</Link><Link href="/driver" className="btn btn-line !border-white/40 !text-white">Open rider app</Link></div></div></section>
    <section className="wrap grid gap-8 py-12 md:grid-cols-2"><div className="space-y-3">{[["Per-delivery pay", `Typically ${pay(lo)} to ${pay(hi)} per delivery depending on distance, shown before you accept.`], ["Weekly payouts", "Money to your UPI or bank account every week. Every delivery and payout is listed in your app."], ["Work near you", "We start with clusters in Satellite, Bodakdev and Prahlad Nagar and grow across Ahmedabad."], ["You need", "A smartphone, a two-wheeler or bicycle, a valid driving licence (for motorised vehicles) and a UPI or bank account."]].map(([t, d]) => <div key={t} className="card p-4"><h3 className="text-xl">{t}</h3><p className="text-sm text-muted">{d}</p></div>)}</div>
      <div className="card p-6"><h2 className="text-3xl">How it works</h2><ol className="mt-4 list-decimal space-y-3 pl-5 text-sm"><li>Sign up with your licence and vehicle details. We verify and approve you.</li><li>Open the app on your phone and go online. Install it to your home screen for alerts.</li><li>Take a delivery you like. See the restaurant, drop area, distance and your pay first.</li><li>Pick up, deliver, and collect cash only on cash-on-delivery orders. Hand cash in as agreed.</li><li>Get paid weekly.</li></ol><Link href="/driver/register" className="btn btn-primary mt-5 w-full">Create rider account</Link></div></section></div>);
}
