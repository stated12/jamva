import type { City } from "@/lib/data";
/** Searchable city box (type to filter; any city can be typed). Plain GET form so it works without JavaScript. */
export default function CityPicker({ action, current, cities }: { action: string; current: string; cities: City[] }) {
  return (<form action={action} method="get" className="card flex flex-wrap items-end gap-3 p-4"><div className="min-w-[12rem] flex-1"><label className="label" htmlFor="city-box">Your city</label>
    <input id="city-box" name="city" list="jv-cities" defaultValue={current} placeholder="Type to search, e.g. Ahmedabad" className="input" autoComplete="off" /><datalist id="jv-cities">{cities.map((c) => <option key={c.slug} value={c.name}>{c.status === "live" ? "Live now" : "Coming soon"}</option>)}</datalist></div>
    <button className="btn btn-dark !py-3">Continue</button><p className="w-full text-xs text-muted">Live in Ahmedabad. Anywhere else, type your city (or any other city) and join the waitlist.</p></form>);
}
