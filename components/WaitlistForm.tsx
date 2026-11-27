import { joinWaitlist } from "@/app/actions";
export default function WaitlistForm({ areas, kind = "customer", cta = "Notify me" }: { areas?: { slug: string; name: string }[]; kind?: string; cta?: string }) {
  return (<form action={joinWaitlist} className="grid gap-3 sm:grid-cols-2"><input type="hidden" name="kind" value={kind} />
    <input name="name" placeholder="Your name" className="input" autoComplete="name" /><input name="phone" placeholder="Mobile number" inputMode="tel" className="input" autoComplete="tel" />
    {areas && <select name="area" className="input sm:col-span-2" defaultValue=""><option value="">Your area in Ahmedabad</option>{areas.map((a) => <option key={a.slug} value={a.slug}>{a.name}</option>)}</select>}
    <button className="btn btn-primary sm:col-span-2">{cta}</button></form>);
}
