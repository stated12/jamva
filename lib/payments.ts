import { db } from "./db";
import { createRzpOrder, fetchRzpPayment } from "./razorpay";
import { markOrderPaid } from "./orders";
import { getListing } from "./pricing";
import { notify, notifyAdmins } from "./notify";
import { razorpayConfigured } from "./env";
import { todayIST } from "./format";
const paise2r = (p: number) => p / 100;
export async function createOrderPayment(order: any, userId: string) {
  if (!razorpayConfigured()) return { ok: false as const, error: "unavailable" };
  const rz = await createRzpOrder(paise2r(order.total_paise), order.code, { purpose: "order", order: order.code });
  await db().from("payments").insert({ purpose: "order", order_id: order.id, user_id: userId, amount_paise: order.total_paise, razorpay_order_id: rz.id });
  await db().from("orders").update({ razorpay_order_id: rz.id }).eq("id", order.id);
  return { ok: true as const, razorpayOrderId: rz.id, amountPaise: order.total_paise, keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID };
}
export async function createListingPayment(restaurant: any, userId: string) {
  if (!razorpayConfigured()) return { ok: false as const, error: "unavailable" };
  const l = await getListing(); const base = Math.round(l.yearly_fee * 100), gst = Math.round((base * l.gst_percent) / 100), total = base + gst;
  const rz = await createRzpOrder(paise2r(total), "LST-" + restaurant.slug, { purpose: "listing", restaurant: restaurant.slug });
  await db().from("payments").insert({ purpose: "listing", restaurant_id: restaurant.id, user_id: userId, amount_paise: total, gst_paise: gst, razorpay_order_id: rz.id });
  return { ok: true as const, razorpayOrderId: rz.id, amountPaise: total, keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID };
}
/** Idempotent settlement for both orders and yearly listings. Called by the checkout callback and by the webhook. */
export async function settlePayment(razorpayOrderId: string, paymentId: string, method?: string, raw?: any) {
  const { data: p } = await db().from("payments").select("*").eq("razorpay_order_id", razorpayOrderId).maybeSingle();
  if (!p || p.status === "paid") return;
  const { data: upd } = await db().from("payments").update({ status: "paid", razorpay_payment_id: paymentId, method: method || null, raw: raw || null, paid_at: new Date().toISOString() }).eq("id", p.id).eq("status", "created").select("id");
  if (!upd?.length) return;
  if (p.purpose === "order" && p.order_id) await markOrderPaid(p.order_id, paymentId);
  if (p.purpose === "listing" && p.restaurant_id) {
    const { data: r } = await db().from("restaurants").select("name,owner_id,listing_paid_until,trial_until").eq("id", p.restaurant_id).maybeSingle();
    const t = todayIST(); const from = [r?.listing_paid_until, r?.trial_until, t].filter(Boolean).sort().pop() as string;
    const d = new Date(from + "T00:00:00Z"); d.setUTCFullYear(d.getUTCFullYear() + 1); d.setUTCDate(d.getUTCDate() - 0);
    await db().from("restaurants").update({ listing_paid_until: d.toISOString().slice(0, 10) }).eq("id", p.restaurant_id);
    await notify(r?.owner_id, { title: "Yearly listing activated", body: `Thank you. ${r?.name} is listed until ${d.toISOString().slice(0, 10)}.`, href: "/partner/dashboard" });
    await notifyAdmins({ title: "Listing fee received", body: `${r?.name} paid the yearly listing fee.`, href: "/admin/restaurants" });
  }
}
/** Used if a customer returns before the webhook: ask Razorpay directly. */
export async function settleFromRazorpay(razorpayOrderId: string, paymentId: string) {
  const pay = await fetchRzpPayment(paymentId);
  if (pay?.order_id === razorpayOrderId && (pay.status === "captured" || pay.status === "authorized")) await settlePayment(razorpayOrderId, paymentId, pay.method, pay);
}
