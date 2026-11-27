import Link from "next/link";
import { db } from "@/lib/db";
import { requireRestaurant } from "@/lib/session";
import { rupees } from "@/lib/format";
import { addCategory, saveItem, toggleItem, deleteItem } from "../actions";
export const metadata = { title: "Menu manager" };
export const dynamic = "force-dynamic";
export default async function Page({ searchParams }: { searchParams: Promise<{ e?: string; saved?: string; edit?: string }> }) {
  const sp = await searchParams; const { r } = await requireRestaurant();
  const [{ data: cats }, { data: items }] = await Promise.all([db().from("menu_categories").select("*").eq("restaurant_id", r.id).order("sort_order"), db().from("menu_items").select("*").eq("restaurant_id", r.id).order("sort_order").order("name")]);
  const edit = (items || []).find((i: any) => i.id === sp.edit);
  return (<div className="wrap max-w-3xl py-8"><Link href="/partner/dashboard" className="text-sm font-extrabold text-chilli">← Dashboard</Link><h1 className="mt-2 text-4xl">Menu · {r.name}</h1><p className="text-sm text-muted">Set the same price you charge in your restaurant. Jamva adds no markup and takes no commission.</p>
    {sp.saved && <p className="mt-3 rounded-xl bg-leaf-soft p-3 text-sm font-semibold text-leaf">Saved.</p>}{sp.e && <p className="mt-3 rounded-xl bg-soft p-3 text-sm font-semibold text-chilli">Please enter a name and a valid price.</p>}
    <section className="card mt-6 p-5"><h2 className="text-2xl">Categories</h2><div className="mt-3 flex flex-wrap gap-2">{(cats || []).map((c: any) => <span key={c.id} className="chip !px-3 !py-1.5 text-sm">{c.name}</span>)}{!(cats || []).length && <p className="text-sm text-muted">Add a category first, such as Starters, Thali or Beverages.</p>}</div>
      <form action={addCategory} className="mt-3 flex gap-2"><input name="name" required maxLength={60} placeholder="New category" className="input" /><button className="btn btn-dark">Add</button></form></section>
    <section className="card mt-6 p-5"><h2 className="text-2xl">{edit ? "Edit dish" : "Add a dish"}</h2><form action={saveItem} className="mt-3 grid gap-3 sm:grid-cols-2" key={edit?.id || "new"}>{edit && <input type="hidden" name="id" value={edit.id} />}
      <div className="sm:col-span-2"><label className="label">Dish name *</label><input name="name" required defaultValue={edit?.name} className="input" /></div><div className="sm:col-span-2"><label className="label">Description</label><input name="description" defaultValue={edit?.description || ""} maxLength={240} className="input" /></div>
      <div><label className="label">Price (₹) *</label><input name="price" type="number" step="0.5" min="0" required defaultValue={edit ? edit.price_paise / 100 : ""} className="input" /></div>
      <div><label className="label">Category</label><select name="category_id" defaultValue={edit?.category_id || ""} className="input"><option value="">None</option>{(cats || []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
      <div><label className="label">Type</label><select name="is_veg" defaultValue={edit && !edit.is_veg ? "no" : "yes"} className="input"><option value="yes">Vegetarian</option><option value="no">Non-vegetarian</option></select></div><div><label className="label">Photo (max 3 MB)</label><input name="image" type="file" accept="image/jpeg,image/png,image/webp" className="input" /></div>
      <label className="flex items-center gap-2 text-sm font-semibold sm:col-span-2"><input type="checkbox" name="is_available" defaultChecked={edit ? edit.is_available : true} className="h-4 w-4" /> Available now</label>
      <div className="flex gap-2 sm:col-span-2"><button className="btn btn-primary">{edit ? "Save changes" : "Add dish"}</button>{edit && <Link href="/partner/menu" className="btn btn-line">Cancel</Link>}</div></form></section>
    <section className="mt-8"><h2 className="text-2xl">Your dishes ({(items || []).length})</h2><ul className="mt-3 divide-y divide-line rounded-2xl border border-line bg-white">{(items || []).map((i: any) => (<li key={i.id} className="flex items-center gap-3 p-3"><span className={i.is_veg ? "veg" : "nonveg"} /><div className="min-w-0 flex-1"><p className="truncate font-bold">{i.name}</p><p className="text-xs text-muted">{rupees(i.price_paise)} · {(cats || []).find((c: any) => c.id === i.category_id)?.name || "No category"}</p></div>
      <form action={toggleItem}><input type="hidden" name="id" value={i.id} /><button className={`chip ${i.is_available ? "bg-leaf-soft text-leaf" : ""}`}>{i.is_available ? "Available" : "Unavailable"}</button></form><Link href={`/partner/menu?edit=${i.id}`} className="text-sm font-extrabold">Edit</Link><form action={deleteItem}><input type="hidden" name="id" value={i.id} /><button className="text-sm font-bold text-chilli">Delete</button></form></li>))}{!(items || []).length && <li className="p-4 text-sm text-muted">No dishes yet.</li>}</ul></section></div>);
}
