"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { clean, todayIST } from "@/lib/format";
import { getListing, getVendorListing } from "@/lib/pricing";
import { notify } from "@/lib/notify";
import { refundOrder, setOrderStatus } from "@/lib/orders";
import { announceToDrivers } from "@/lib/drivers";
export async function restaurantDecision(fd: FormData) {
  await requireAdmin(); const id = clean(fd.get("id"), 40), act = clean(fd.get("act"), 20), note = clean(fd.get("note"), 300) || null;
  const { data: r } = await db().from("restaurants").select("id,name,owner_id,trial_until,kind").eq("id", id).maybeSingle(); if (!r) return;
  if (act === "approve") {
    const l = r.kind === "street_vendor" ? await getVendorListing() : await getListing(); const d = new Date(todayIST() + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + (l.trial_days || 90));
    await db().from("restaurants").update({ status: "approved", approved_at: new Date().toISOString(), trial_until: r.trial_until || d.toISOString().slice(0, 10), admin_note: note }).eq("id", id);
    await notify(r.owner_id, { title: `${r.name} is approved`, body: `You have ${l.trial_days} days of free listing. Add your menu and tap Open to start receiving orders.`, href: "/partner/menu" });
  } else if (act === "open" || act === "close") {
    await db().from("restaurants").update({ is_open: act === "open" }).eq("id", id).eq("status", "approved");
  } else if (act === "reject" || act === "suspend") {
    await db().from("restaurants").update({ status: act === "reject" ? "rejected" : "suspended", is_open: false, admin_note: note }).eq("id", id);
    await notify(r.owner_id, { title: act === "reject" ? `${r.name}: application not approved` : `${r.name} is suspended`, body: note || "Please contact Jamva support.", href: "/partner/dashboard" });
  }
  revalidatePath("/admin/restaurants"); revalidatePath("/admin/leads");
}
export async function adminOrderAction(fd: FormData) {
  await requireAdmin(); const id = clean(fd.get("id"), 40), act = clean(fd.get("act"), 20);
  if (act === "refund") await refundOrder(id);
  else if (["picked_up", "delivered", "cancelled"].includes(act)) await setOrderStatus(id, act, act === "cancelled" ? "Cancelled by Jamva support" : undefined);
  revalidatePath("/admin/orders");
}
export async function saveSettings(fd: FormData) {
  await requireAdmin();
  const tiers = [2, 4, 6, 8].map((km, i) => ({ upto_km: Number(fd.get("km" + i)) || km, fee: Math.max(0, Number(fd.get("fee" + i)) || 0) })).sort((a, b) => a.upto_km - b.upto_km);
  const fees = { tiers, max_km: tiers[tiers.length - 1].upto_km, gst_percent: Math.max(0, Number(fd.get("gst")) || 0), small_order_below: 0, cod_enabled: fd.get("cod") === "on", online_enabled: fd.get("online") === "on" };
  const listing = { yearly_fee: Math.max(0, Number(fd.get("yearly_fee")) || 0), gst_percent: Math.max(0, Number(fd.get("listing_gst")) || 0), trial_days: Math.max(0, Math.floor(Number(fd.get("trial_days")) || 0)) };
  const driver = { pay_percent: Math.min(100, Math.max(0, Number(fd.get("pay_percent")) || 0)), min_pay: Math.max(0, Number(fd.get("min_pay")) || 0), max_active: Math.min(5, Math.max(1, Math.floor(Number(fd.get("max_active")) || 2))) };
  const vendor = { monthly_fee: Math.max(0, Number(fd.get("v_monthly")) || 0), yearly_fee: Math.max(0, Number(fd.get("v_yearly")) || 0), gst_percent: Math.max(0, Number(fd.get("v_gst")) || 0), trial_days: Math.max(0, Math.floor(Number(fd.get("v_trial")) || 0)) };
  await db().from("settings").upsert([{ key: "fees", value: fees }, { key: "listing", value: listing }, { key: "driver", value: driver }, { key: "vendor_listing", value: vendor }], { onConflict: "key" }); revalidatePath("/admin/settings");
}
export async function driverDecision(fd: FormData) {
  await requireAdmin(); const id = clean(fd.get("id"), 40), act = clean(fd.get("act"), 20), note = clean(fd.get("note"), 300) || null;
  const { data: d } = await db().from("drivers").select("id,name,user_id").eq("id", id).maybeSingle(); if (!d) return;
  if (act === "approve") {
    await db().from("drivers").update({ status: "active", approved_at: new Date().toISOString(), admin_note: note }).eq("id", id);
    await notify(d.user_id, { title: "You are approved as a Jamva rider", body: "Open the rider app, go online and take your first delivery.", href: "/driver" });
  } else if (act === "block") {
    await db().from("drivers").update({ status: "blocked", is_online: false, admin_note: note }).eq("id", id);
    await notify(d.user_id, { title: "Your rider account is not active", body: note || "Please contact Jamva support.", href: "/driver" });
  }
  revalidatePath("/admin/drivers"); revalidatePath("/admin/leads");
}
export async function driverLedgerEntry(fd: FormData) {
  await requireAdmin(); const id = clean(fd.get("id"), 40), kind = clean(fd.get("kind"), 20), amount = Math.round(Number(fd.get("amount")) * 100);
  if (!["payout", "cash_deposit"].includes(kind) || !(amount > 0) || amount > 100000000) return;
  const { data: d } = await db().from("drivers").select("id,user_id").eq("id", id).maybeSingle(); if (!d) return;
  await db().from("driver_ledger").insert({ driver_id: id, kind, amount_paise: amount, note: clean(fd.get("note"), 120) || null });
  await notify(d.user_id, { title: kind === "payout" ? "Payout sent to you" : "Cash deposit recorded", body: `₹${(amount / 100).toLocaleString("en-IN")} recorded in your earnings.`, href: "/driver/earnings" });
  revalidatePath("/admin/drivers");
}
export async function adminAssignDriver(fd: FormData) {
  await requireAdmin(); const id = clean(fd.get("id"), 40), driverId = clean(fd.get("driver_id"), 40);
  const { data: o } = await db().from("orders").select("id,code,status,customer_id,delivery_fee_paise,address,restaurants:jm_restaurants(name)").eq("id", id).maybeSingle();
  if (!o || !["accepted", "preparing", "ready", "picked_up"].includes(o.status)) return;
  if (!driverId) { await db().from("orders").update({ driver_id: null, driver_assigned_at: null }).eq("id", id); if (o.status !== "picked_up") await announceToDrivers(o); revalidatePath("/admin/orders"); return; }
  const { data: d } = await db().from("drivers").select("id,name,user_id,status").eq("id", driverId).maybeSingle(); if (!d || d.status !== "active") return;
  await db().from("orders").update({ driver_id: d.id, driver_assigned_at: new Date().toISOString() }).eq("id", id);
  await db().from("order_events").insert({ order_id: id, status: o.status, note: `Rider assigned by Jamva: ${d.name}` });
  await notify(d.user_id, { title: `Delivery ${o.code} assigned to you`, body: `Pick up from ${o.restaurants?.name || "the restaurant"}.`, href: "/driver" });
  await notify(o.customer_id, { title: `Order ${o.code}: ${d.name} will deliver it`, body: "You can call your rider from the order page.", href: `/order/${o.code}` });
  revalidatePath("/admin/orders");
}
export async function leadUpdate(fd: FormData) {
  await requireAdmin(); const id = clean(fd.get("id"), 40), st = clean(fd.get("status"), 12);
  await db().from("waitlist").update({ status: ["new", "contacted", "closed"].includes(st) ? st : "new", note: clean(fd.get("note"), 300) || null }).eq("id", id); revalidatePath("/admin/leads");
}
export async function setCityStatus(fd: FormData) {
  await requireAdmin(); const id = clean(fd.get("id"), 40), st = clean(fd.get("status"), 10) === "live" ? "live" : "waitlist";
  await db().from("cities").update({ status: st }).eq("id", id); revalidatePath("/admin/cities"); revalidatePath("/", "layout");
}
export async function addCity(fd: FormData) {
  await requireAdmin(); const name = clean(fd.get("name"), 60); if (name.length < 2) return;
  await db().from("cities").upsert({ slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""), name, state: clean(fd.get("state"), 60) || null, status: "waitlist", sort_order: 200 }, { onConflict: "slug" }); revalidatePath("/admin/cities");
}
