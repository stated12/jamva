import { db } from "@/lib/db";
import { listCities } from "@/lib/data";
import { setCityStatus, addCity } from "../actions";
export const dynamic = "force-dynamic";
export default async function Page() {
  const cities = await listCities(); const { data } = await db().from("cities").select("id,slug,name,state,status").order("sort_order");
  const rows: any[] = data || cities;
  return (<div><h1 className="text-3xl">Cities</h1><p className="mt-1 text-sm text-muted">Live cities use full onboarding (accounts, approval, orders). Waitlist cities collect leads with city and PIN. Making a city Live switches its forms to onboarding straight away. Areas for a new city must be added to the database before orders can be taken there.</p>
    <ul className="card mt-4 divide-y divide-line">{rows.map((c: any) => (<li key={c.slug} className="flex flex-wrap items-center justify-between gap-3 p-3"><span><b>{c.name}</b> <span className="text-sm text-muted">{c.state}</span> <span className={`chip ml-1 ${c.status === "live" ? "bg-leaf-soft text-leaf" : ""}`}>{c.status === "live" ? "Live" : "Waitlist only"}</span></span>
      {c.id && <form action={setCityStatus}><input type="hidden" name="id" value={c.id} /><button name="status" value={c.status === "live" ? "waitlist" : "live"} className="btn btn-line !py-2 text-sm">{c.status === "live" ? "Switch to Waitlist" : "Make Live"}</button></form>}</li>))}</ul>
    <form action={addCity} className="card mt-4 flex flex-wrap gap-2 p-4"><input name="name" required placeholder="Add a city" className="input !w-56" /><input name="state" placeholder="State" className="input !w-48" /><button className="btn btn-dark !py-2">Add to waitlist cities</button></form></div>);
}
