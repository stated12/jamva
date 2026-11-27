"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { authClient, currentUser } from "@/lib/supabase-server";
import { allow } from "@/lib/ratelimit";
import { clean, isPhone, normPhone } from "@/lib/format";
import { notify, notifyAdmins } from "@/lib/notify";
import { getDriverCfg, requireDriver, announceToDrivers } from "@/lib/drivers";
import { setOrderStatus } from "@/lib/orders";
import { createAccount } from "../actions";
import { resolveCity } from "@/lib/data";

export async function registerDriver(fd: FormData) {
  if (!(await allow("driver-register", 6, 3600))) redirect("/driver/register?e=rate");
  let user = await currentUser();
  const email = clean(fd.get("email"), 120).toLowerCase(), password = String(fd.get("password") || ""), name = clean(fd.get("name"), 80), phone = normPhone(clean(fd.get("phone"), 20));
  const vehicle = clean(fd.get("vehicle"), 30) || "Two-wheeler", vehicleNo = clean(fd.get("vehicle_no"), 20).toUpperCase(), licence = clean(fd.get("licence_no"), 30).toUpperCase(), areaSlug = clean(fd.get("area"), 40), upi = clean(fd.get("upi_id"), 60);
  const geo = await resolveCity(clean(fd.get("city"), 60)); if (!geo.live) redirect("/driver/register?city=" + encodeURIComponent(geo.name));
  const licStatus = clean(fd.get("licence_status"), 10) === "learner" ? "learner" : "yes", shift = clean(fd.get("shift"), 30) || "Full-Time";
  if (name.length < 2 || !isPhone(phone) || vehicleNo.length < 4 || (licStatus === "yes" && licence.length < 8) || !areaSlug) redirect("/driver/register?e=invalid");
  if (!user) {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || password.length < 8) redirect("/driver/register?e=invalid");
    const err = await createAccount(email, password, name, phone); if (err) redirect("/driver/register?e=" + err);
    const { error } = await (await authClient()).auth.signInWithPassword({ email, password }); if (error) redirect("/login?next=/driver/register");
    user = await currentUser();
  }
  if (!user) redirect("/login?next=/driver/register");
  const { data: existing } = await db().from("drivers").select("id").eq("user_id", user.id).maybeSingle();
  if (existing) redirect("/driver");
  const { data: area } = await db().from("areas").select("id").eq("slug", areaSlug).maybeSingle(); if (!area) redirect("/driver/register?e=invalid");
  const { error } = await db().from("drivers").insert({ user_id: user.id, name, phone, vehicle, vehicle_no: vehicleNo, licence_no: licence || null, licence_status: licStatus, shift, city: geo.name, pincode: clean(fd.get("pincode"), 6).replace(/\D/g, "") || null, area_id: area.id, upi_id: upi || null });
  if (error) redirect("/driver/register?e=save");
  await db().from("profiles").update({ phone, full_name: name }).eq("id", user.id);
  await notifyAdmins({ title: "New rider application", body: `${name} (${areaSlug})`, href: "/admin/drivers" });
  redirect("/driver?welcome=1");
}
export async function toggleOnline() {
  const { d } = await requireDriver(); if (d.status !== "active") return;
  await db().from("drivers").update({ is_online: !d.is_online, last_seen_at: new Date().toISOString() }).eq("id", d.id); revalidatePath("/driver");
}
/** Take an open delivery. The database claim is atomic, so two riders can never get the same order. */
export async function claimOrder(fd: FormData) {
  const { d } = await requireDriver(); if (d.status !== "active") return;
  const id = clean(fd.get("id"), 40); const cfg = await getDriverCfg();
  const { data: ok } = await db().rpc("claim_order", { p_order: id, p_driver: d.id, p_max: cfg.max_active || 2 });
  if (ok === true) {
    const { data: o } = await db().from("orders").select("id,code,customer_id,status,restaurants:jm_restaurants(owner_id,name)").eq("id", id).maybeSingle();
    if (o) {
      await db().from("order_events").insert({ order_id: o.id, status: o.status, note: `Rider assigned: ${d.name}` });
      await notify(o.customer_id, { title: `Order ${o.code}: ${d.name} will deliver it`, body: "You can call your rider from the order page.", href: `/order/${o.code}` });
      await notify(o.restaurants?.owner_id, { title: `Rider assigned to ${o.code}`, body: `${d.name} will pick it up.`, href: "/partner/dashboard" });
    }
    revalidatePath("/driver"); redirect("/driver?taken=1");
  }
  redirect("/driver?e=gone");
}
/** Pick up, deliver or hand back one of my own orders. */
export async function driverAction(fd: FormData) {
  const { d } = await requireDriver(); const id = clean(fd.get("id"), 40), act = clean(fd.get("act"), 20);
  const { data: o } = await db().from("orders").select("id,code,status,restaurants:jm_restaurants(owner_id,name)").eq("id", id).eq("driver_id", d.id).maybeSingle(); if (!o) return;
  if (act === "pickup" && o.status === "ready") await setOrderStatus(o.id, "picked_up", `Picked up by ${d.name}`);
  else if (act === "delivered" && o.status === "picked_up") await setOrderStatus(o.id, "delivered", `Delivered by ${d.name}`);
  else if (act === "release" && ["accepted", "preparing", "ready"].includes(o.status)) {
    await db().from("orders").update({ driver_id: null, driver_assigned_at: null }).eq("id", o.id).eq("driver_id", d.id);
    await db().from("order_events").insert({ order_id: o.id, status: o.status, note: `${d.name} released the delivery` });
    await notify(o.restaurants?.owner_id, { title: `Rider left ${o.code}`, body: "Another rider will be offered the delivery.", href: "/partner/dashboard" });
    const { data: full } = await db().from("orders").select("id,code,delivery_fee_paise,address,restaurants:jm_restaurants(name)").eq("id", o.id).maybeSingle();
    if (full) { await announceToDrivers(full); }
  }
  revalidatePath("/driver");
}
export async function saveDriverProfile(fd: FormData) {
  const { d } = await requireDriver();
  const phone = normPhone(clean(fd.get("phone"), 20));
  await db().from("drivers").update({ phone: isPhone(phone) ? phone : d.phone, vehicle: clean(fd.get("vehicle"), 30) || d.vehicle, vehicle_no: clean(fd.get("vehicle_no"), 20).toUpperCase() || d.vehicle_no, upi_id: clean(fd.get("upi_id"), 60) || null, bank_account: clean(fd.get("bank_account"), 30) || null, bank_ifsc: clean(fd.get("bank_ifsc"), 15).toUpperCase() || null }).eq("id", d.id);
  revalidatePath("/driver/earnings"); redirect("/driver/earnings?saved=1");
}
