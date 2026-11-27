import Link from "next/link";
import { registerDriver } from "../actions";
import { listAreas, listCities, resolveCity } from "@/lib/data";
import CityPicker from "@/components/CityPicker";
import LeadForm from "@/components/LeadForm";
import { currentUser } from "@/lib/supabase-server";
export const metadata = { title: "Become a Jamva rider" };
export const dynamic = "force-dynamic";
const MSG: Record<string, string> = { invalid: "Please check all fields. Password needs 8+ characters, vehicle number and licence number are required.", exists: "This email already has an account. Sign in first, then come back to this page.", create: "Could not create your account. Please try again.", save: "Could not save your application. Please try again.", rate: "Too many attempts. Please try later.", lead: "Please enter your name and a valid 10-digit mobile number." };
export default async function Page({ searchParams }: { searchParams: Promise<{ e?: string; city?: string }> }) {
  const sp = await searchParams; const [areas, user, cities, geo] = await Promise.all([listAreas(), currentUser(), listCities(), resolveCity(sp.city)]);
  return (<div className="max-w-2xl"><p className="kicker">Rider application</p><h1 className="text-4xl">Deliver with Jamva in Ahmedabad</h1><p className="mt-2 text-muted">Fair pay per delivery, weekly payouts. We verify every rider before the first delivery.</p>
    {sp.e && <p className="mt-4 rounded-xl bg-soft p-3 text-sm font-semibold text-chilli">{MSG[sp.e] || MSG.invalid} {sp.e === "exists" && <Link href="/login?next=/driver/register" className="underline">Sign in</Link>}</p>}
    <div className="mt-6"><CityPicker action="/driver/register" current={geo.name} cities={cities} /></div>
    {!geo.live ? <LeadForm role="driver" city={geo.name} /> :
    <form action={registerDriver} className="mt-6 space-y-6"><input type="hidden" name="city" value={geo.name} />
      {!user ? <section className="card p-5"><h2 className="text-2xl">Your login</h2><div className="mt-4 grid gap-3 sm:grid-cols-2"><div><label className="label">Email *</label><input name="email" type="email" required className="input" autoComplete="email" /></div><div><label className="label">Password (8+ characters) *</label><input name="password" type="password" required minLength={8} className="input" autoComplete="new-password" /></div></div></section>
        : <p className="card p-4 text-sm font-semibold">Signed in as {user.email}. The rider profile will be linked to this account.</p>}
      <section className="card p-5"><h2 className="text-2xl">About you</h2><div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div><label className="label">Full name *</label><input name="name" required className="input" /></div><div><label className="label">Mobile number *</label><input name="phone" required inputMode="tel" className="input" /></div>
        <div><label className="label">Vehicle</label><select name="vehicle" className="input" defaultValue="Bike / Scooter"><option>Bike / Scooter</option><option>Electric Vehicle (EV)</option><option>Cycle</option></select></div><div><label className="label">Vehicle number *</label><input name="vehicle_no" required className="input" placeholder="GJ01AB1234 (cycle: write CYCLE)" /></div>
        <div><label className="label">Driving licence</label><select name="licence_status" className="input" defaultValue="yes"><option value="yes">Yes, I have a licence</option><option value="learner">Learner / Applying</option></select></div><div><label className="label">Licence number (if you have one)</label><input name="licence_no" className="input" /></div><div><label className="label">Preferred shift</label><select name="shift" className="input"><option>Full-Time</option><option>Part-Time / Evening</option></select></div><div><label className="label">PIN code</label><input name="pincode" inputMode="numeric" maxLength={6} className="input" /></div>
        <div><label className="label">Area you work in *</label><select name="area" required className="input" defaultValue=""><option value="" disabled>Select area</option>{areas.map((a: any) => <option key={a.slug} value={a.slug}>{a.name}</option>)}</select></div>
        <div className="sm:col-span-2"><label className="label">UPI ID for payouts (can add later)</label><input name="upi_id" className="input" placeholder="name@bank" /></div></div></section>
      <label className="flex items-start gap-2 text-sm"><input type="checkbox" required className="mt-1 h-4 w-4" /> <span>I confirm the details are correct. Motorised riders need a valid driving licence before the first delivery. I agree to the <Link href="/terms" className="underline" target="_blank">Terms</Link>.</span></label>
      <button className="btn btn-primary w-full !py-4 text-lg">Submit application</button></form>}</div>);
}
