import { saveLead } from "@/app/actions";
/** Short form for people in a city where Jamva is not live yet. Stored as a waitlist lead with city and PIN so demand can be ranked. */
export default function LeadForm({ role, city }: { role: "restaurant" | "vendor" | "driver"; city: string }) {
  const biz = role !== "driver";
  return (<form action={saveLead} className="card mt-4 space-y-4 p-5"><input type="hidden" name="role" value={role} /><input type="hidden" name="city" value={city} />
    <p className="rounded-xl bg-leaf-soft p-3 text-sm font-semibold text-leaf">We are starting in Ahmedabad. Leave your details and you will be on our priority waitlist for {city}. We will contact you as soon as we launch there.</p>
    <div className="grid gap-3 sm:grid-cols-2"><div><label className="label">Full name *</label><input name="name" required className="input" autoComplete="name" /></div><div><label className="label">Mobile number *</label><input name="phone" required inputMode="tel" className="input" autoComplete="tel" placeholder="10-digit number" /></div>
      <div><label className="label">Area / locality</label><input name="area" className="input" /></div><div><label className="label">PIN code</label><input name="pincode" inputMode="numeric" maxLength={6} className="input" /></div>
      {biz && <><div><label className="label">{role === "vendor" ? "Stall / cart name" : "Business name"}</label><input name="business" className="input" /></div>
        <div><label className="label">Category</label><select name="category" className="input" defaultValue={role === "vendor" ? "Street Cart / Stall" : "Restaurant"}>{["Restaurant", "Cloud Kitchen", "Street Cart / Stall", "Cafe / Bakery"].map((c) => <option key={c}>{c}</option>)}</select></div>
        <div className="sm:col-span-2"><label className="label">Cuisine</label><input name="cuisine" className="input" placeholder="Gujarati, Chaat, Biryani" /></div>
        <div className="sm:col-span-2"><label className="label">FSSAI status</label><select name="fssai_status" className="input" defaultValue="have"><option value="have">Have FSSAI</option><option value="applied">Applied</option><option value="help">Need help registering</option></select></div></>}
      {!biz && <><div><label className="label">Vehicle</label><select name="vehicle" className="input"><option>Bike / Scooter</option><option>Electric Vehicle (EV)</option><option>Cycle</option></select></div>
        <div><label className="label">Driving licence</label><select name="licence_status" className="input"><option value="yes">Yes</option><option value="learner">Learner / Applying</option></select></div>
        <div className="sm:col-span-2"><label className="label">Preferred shift</label><select name="shift" className="input"><option>Full-Time</option><option>Part-Time / Evening</option></select></div></>}</div>
    <button className="btn btn-primary w-full">Join the waitlist for {city}</button></form>);
}
