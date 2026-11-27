"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { authClient, currentUser } from "@/lib/supabase-server";
import { allow } from "@/lib/ratelimit";
import { clean, isPhone, normPhone, slugify } from "@/lib/format";
import { uploadImage } from "@/lib/upload";
import { notifyAdmins } from "@/lib/notify";
import { requireRestaurant } from "@/lib/session";
import { setOrderStatus, NEXT_STATUS } from "@/lib/orders";
import { createAccount } from "../actions";

export async function registerRestaurant(fd: FormData) {
  if (!(await allow("partner-register", 6, 3600))) redirect("/partner/register?e=rate");
  let user = await currentUser();
  const email = clean(fd.get("email"), 120).toLowerCase(), password = String(fd.get("password") || ""), owner = clean(fd.get("owner_name"), 80), phone = normPhone(clean(fd.get("phone"), 20));
  const name = clean(fd.get("name"), 80), address = clean(fd.get("address"), 240), areaSlug = clean(fd.get("area"), 40), fssai = clean(fd.get("fssai_no"), 20).replace(/\s/g, "");
  if (name.length < 2 || address.length < 8 || !isPhone(phone) || !areaSlug) redirect("/partner/register?e=invalid");
  if (!/^\d{14}$/.test(fssai)) redirect("/partner/register?e=fssai");
  if (!user) {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || password.length < 8 || owner.length < 2) redirect("/partner/register?e=invalid");
    const err = await createAccount(email, password, owner, phone); if (err) redirect("/partner/register?e=" + err);
    const { error } = await (await authClient()).auth.signInWithPassword({ email, password }); if (error) redirect("/login?next=/partner/register");
    user = await currentUser();
  }
  if (!user) redirect("/login?next=/partner/register");
  const { data: existing } = await db().from("restaurants").select("id").eq("owner_id", user.id).limit(1).maybeSingle();
  if (existing) redirect("/partner/dashboard");
  const { data: area } = await db().from("areas").select("id,lat,lng").eq("slug", areaSlug).maybeSingle(); if (!area) redirect("/partner/register?e=invalid");
  let slug = slugify(name); const { data: clash } = await db().from("restaurants").select("id").eq("slug", slug).maybeSingle(); if (clash) slug += "-" + Math.random().toString(36).slice(2, 5);
  const cuisines = clean(fd.get("cuisines"), 120).split(",").map((s) => s.trim()).filter(Boolean).slice(0, 6);
  const logo = await uploadImage(fd.get("logo"), "logos"), cover = await uploadImage(fd.get("cover"), "covers");
  const { error } = await db().from("restaurants").insert({ owner_id: user.id, slug, name, tagline: clean(fd.get("tagline"), 100) || null, description: clean(fd.get("description"), 600) || null, cuisines, area_id: area.id, address, lat: area.lat, lng: area.lng,
    phone, whatsapp: normPhone(clean(fd.get("whatsapp"), 20)) || phone, contact_email: clean(fd.get("contact_email"), 120) || email || null, fssai_no: fssai, gstin: clean(fd.get("gstin"), 15).toUpperCase() || null, owner_name: owner || null,
    veg_only: fd.get("veg_only") === "on", logo_url: logo, cover_url: cover });
  if (error) redirect("/partner/register?e=save");
  await db().from("profiles").update({ phone, full_name: owner || undefined }).eq("id", user.id);
  await notifyAdmins({ title: "New restaurant application", body: `${name} (${areaSlug})`, href: "/admin/restaurants" });
  redirect("/partner/dashboard?welcome=1");
}
export async function updateRestaurant(fd: FormData) {
  const { r } = await requireRestaurant();
  const patch: Record<string, any> = { tagline: clean(fd.get("tagline"), 100) || null, description: clean(fd.get("description"), 600) || null, prep_minutes: Math.min(120, Math.max(5, Number(fd.get("prep_minutes")) || 25)),
    min_order_paise: Math.max(0, Math.round((Number(fd.get("min_order")) || 0) * 100)), phone: normPhone(clean(fd.get("phone"), 20)) || r.phone, whatsapp: normPhone(clean(fd.get("whatsapp"), 20)) || null, veg_only: fd.get("veg_only") === "on",
    cuisines: clean(fd.get("cuisines"), 120).split(",").map((s) => s.trim()).filter(Boolean).slice(0, 6) };
  const logo = await uploadImage(fd.get("logo"), "logos"), cover = await uploadImage(fd.get("cover"), "covers"); if (logo) patch.logo_url = logo; if (cover) patch.cover_url = cover;
  await db().from("restaurants").update(patch).eq("id", r.id); revalidatePath("/partner/dashboard"); redirect("/partner/dashboard?saved=1");
}
export async function toggleOpen() {
  const { r } = await requireRestaurant(); if (r.status !== "approved") return;
  await db().from("restaurants").update({ is_open: !r.is_open }).eq("id", r.id); revalidatePath("/partner/dashboard");
}
export async function addCategory(fd: FormData) {
  const { r } = await requireRestaurant(); const name = clean(fd.get("name"), 60); if (!name) return;
  const { count } = await db().from("menu_categories").select("id", { count: "exact", head: true }).eq("restaurant_id", r.id);
  await db().from("menu_categories").insert({ restaurant_id: r.id, name, sort_order: (count || 0) + 1 }); revalidatePath("/partner/menu");
}
export async function saveItem(fd: FormData) {
  const { r } = await requireRestaurant(); const id = clean(fd.get("id"), 40); const name = clean(fd.get("name"), 80); const price = Math.round(Number(fd.get("price")) * 100);
  if (!name || !(price >= 0) || price > 5000000) redirect("/partner/menu?e=invalid");
  const catId = clean(fd.get("category_id"), 40) || null;
  if (catId) { const { data: c } = await db().from("menu_categories").select("id").eq("id", catId).eq("restaurant_id", r.id).maybeSingle(); if (!c) redirect("/partner/menu?e=invalid"); }
  const row: Record<string, any> = { restaurant_id: r.id, name, description: clean(fd.get("description"), 240) || null, price_paise: price, is_veg: fd.get("is_veg") !== "no", category_id: catId, is_available: fd.get("is_available") === "on" };
  const img = await uploadImage(fd.get("image"), "dishes"); if (img) row.image_url = img;
  if (id) await db().from("menu_items").update(row).eq("id", id).eq("restaurant_id", r.id); else await db().from("menu_items").insert(row);
  revalidatePath("/partner/menu"); redirect("/partner/menu?saved=1");
}
export async function toggleItem(fd: FormData) {
  const { r } = await requireRestaurant(); const id = clean(fd.get("id"), 40);
  const { data: it } = await db().from("menu_items").select("is_available").eq("id", id).eq("restaurant_id", r.id).maybeSingle(); if (!it) return;
  await db().from("menu_items").update({ is_available: !it.is_available }).eq("id", id).eq("restaurant_id", r.id); revalidatePath("/partner/menu");
}
export async function deleteItem(fd: FormData) {
  const { r } = await requireRestaurant(); await db().from("menu_items").delete().eq("id", clean(fd.get("id"), 40)).eq("restaurant_id", r.id); revalidatePath("/partner/menu");
}
/** Restaurant moves an order forward. In phase 1 the restaurant (or Jamva admin) also marks pickup and delivery; the driver app will take over those two steps. */
export async function orderAction(fd: FormData) {
  const { r } = await requireRestaurant(); const id = clean(fd.get("id"), 40), act = clean(fd.get("act"), 20);
  const { data: o } = await db().from("orders").select("id,status").eq("id", id).eq("restaurant_id", r.id).maybeSingle(); if (!o) return;
  if (act === "reject" && o.status === "placed") await setOrderStatus(o.id, "rejected", clean(fd.get("reason"), 120) || "Restaurant could not accept this order");
  else if (act === "next" && NEXT_STATUS[o.status]) await setOrderStatus(o.id, NEXT_STATUS[o.status]);
  else if (act === "pickup" && o.status === "ready") await setOrderStatus(o.id, "picked_up");
  else if (act === "delivered" && o.status === "picked_up") await setOrderStatus(o.id, "delivered");
  revalidatePath("/partner/dashboard");
}
