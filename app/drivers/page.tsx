import WaitlistForm from "@/components/WaitlistForm";
import { listAreas } from "@/lib/data";
export const metadata = { title: "Ride with Jamva", description: "Deliver with Jamva in Ahmedabad. Fair per-delivery pay, weekly payouts." };
export const dynamic = "force-dynamic";
export default async function Page({ searchParams }: { searchParams: Promise<{ w?: string }> }) {
  const sp = await searchParams; const areas = await listAreas().catch(() => []);
  return (<div><section className="bg-ink text-white"><div className="wrap py-16"><p className="kicker !text-kesar">Delivery partners</p><h1 className="mt-3 max-w-2xl text-5xl">Deliver with Jamva. Earn fairly.</h1><p className="mt-4 max-w-xl text-white/75">Customers pay a clear delivery fee and it goes to paying riders properly. Our rider app is coming soon. Register your interest now and we will onboard you first.</p></div></section>
    <section className="wrap grid gap-8 py-12 md:grid-cols-2"><div className="space-y-3">{[["Per-delivery pay", "Know the payout for each delivery before you accept it."], ["Weekly payouts", "Money to your bank account every week."], ["Work near you", "We start with clusters in Satellite, Bodakdev and Prahlad Nagar."], ["You need", "A smartphone, a two-wheeler, a valid driving licence and a bank account."]].map(([t, d]) => <div key={t} className="card p-4"><h3 className="text-xl">{t}</h3><p className="text-sm text-muted">{d}</p></div>)}</div>
      <div className="card p-6"><h2 className="text-3xl">Register your interest</h2>{sp.w === "ok" && <p className="mt-3 rounded-xl bg-leaf-soft p-3 font-bold text-leaf">Thank you! We will call you soon.</p>}<div className="mt-4"><WaitlistForm kind="driver" areas={areas} cta="Register interest" /></div></div></section></div>);
}
