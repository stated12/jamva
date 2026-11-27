"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { clean, todayIST } from "@/lib/format";
import { getListing } from "@/lib/pricing";
import { notify } from "@/lib/notify";
import { refundOrder, setOrderStatus } from "@/lib/orders";
export async function restaurantDecision(fd: FormData) {
  await requireAdmin(); const id = clean(fd.get("id"), 40), act = clean(fd.get("act"), 20), note = clean(fd.get("note"), 300) || null;
  const { data: r } = await db().from("restaurants").select("id,name,owner_id,trial_until").eq("id", id).maybeSingle(); if (!r) return;
  if (act === "approve") {
    const l = await getListing(); const d = new Date(todayIST() + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + (l.trial_days || 90));
    await db().from("restaurants").update({ status: "approved", approved_at: new Date().toISOString(), trial_until: r.trial_until || d.toISOString().slice(0, 10), admin_note: note }).eq("id", id);
    await notify(r.owner_id, { title: `${r.name} is approved`, body: `You have ${l.trial_days} days of free listing. Add your menu and tap Open to start receiving orders.`, href: "/partner/menu" });
  } else if (act === "reject" || act === "suspend") {
    await db().from("restaurants").update({ status: act === "reject" ? "rejected" : "suspended", is_open: false, admin_note: note }).eq("id", id);
    await notify(r.owner_id, { title: act === "reject" ? `${r.name}: application not approved` : `${r.name} is suspended`, body: note || "Please contact Jamva support.", href: "/partner/dashboard" });
  }
  revalidatePath("/admin/restaurants");
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
  await db().from("settings").upsert([{ key: "fees", value: fees }, { key: "listing", value: listing }], { onConflict: "key" }); revalidatePath("/admin/settings");
}
