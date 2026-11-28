import { db } from "./db";
import { notify, whatsappOrder } from "./notify";
import { rupees } from "./format";
import { announceToDrivers, getDriverCfg, riderPay } from "./drivers";
/** Marks an online order as paid and tells the restaurant. Idempotent: running it twice does nothing the second time. */
export async function markOrderPaid(orderId: string, paymentId: string) {
  const { data: o } = await db().from("orders").select("*, restaurants:jm_restaurants(owner_id,name,whatsapp,phone)").eq("id", orderId).maybeSingle();
  if (o && o.status === "cancelled" && o.cancel_reason === "Payment not completed" && o.payment_method === "online") { // paid after the 30-minute window closed the order: give the money back
    await db().from("orders").update({ payment_status: "paid", razorpay_payment_id: paymentId }).eq("id", orderId); await refundOrder(orderId); return;
  }
  if (!o || o.status !== "pending_payment") return;
  const { error } = await db().from("orders").update({ status: "placed", payment_status: "paid", razorpay_payment_id: paymentId, placed_at: new Date().toISOString() }).eq("id", orderId).eq("status", "pending_payment");
  if (error) return;
  await db().from("order_events").insert({ order_id: orderId, status: "placed", note: "Paid online" });
  await announceNewOrder(o);
}
export async function announceNewOrder(o: any) {
  const r = o.restaurants;
  await notify(r?.owner_id, { title: `New order ${o.code}`, body: `${rupees(o.total_paise)} · ${o.payment_method === "cod" ? "Cash on delivery" : "Paid online"}. Please accept it.`, href: "/partner/dashboard" });
  await whatsappOrder(r?.whatsapp || r?.phone, o.code, o.total_paise);
  await notify(o.customer_id, { title: `Order ${o.code} placed`, body: `${r?.name || "The restaurant"} will confirm shortly.`, href: `/order/${o.code}` });
}
export const NEXT_STATUS: Record<string, string> = { placed: "accepted", accepted: "preparing", preparing: "ready" };
import { refundRzpPayment } from "./razorpay";
/** Refunds a paid online order in full via Razorpay. If that fails the order is flagged refund_due so an admin can retry. */
export async function refundOrder(orderId: string) {
  const { data: o } = await db().from("orders").select("id,payment_method,payment_status,razorpay_payment_id,total_paise,code").eq("id", orderId).maybeSingle();
  if (!o || o.payment_method !== "online" || o.payment_status !== "paid" || !o.razorpay_payment_id) return;
  try { await refundRzpPayment(o.razorpay_payment_id, o.total_paise / 100, { order: o.code }); await db().from("orders").update({ payment_status: "refunded" }).eq("id", orderId); await db().from("payments").update({ status: "refunded" }).eq("order_id", orderId); }
  catch { await db().from("orders").update({ payment_status: "refund_due" }).eq("id", orderId); }
}
/** Which current statuses may move to each new status. The update below only matches those rows, so two taps or two devices can never apply the same step twice. */
const FROM: Record<string, string[]> = { accepted: ["placed"], preparing: ["accepted"], ready: ["accepted", "preparing"], picked_up: ["ready"], delivered: ["picked_up"], rejected: ["placed"], cancelled: ["pending_payment", "placed", "accepted", "preparing", "ready", "picked_up"] };
/** `admin` lets support skip steps (for example mark delivered from ready) but never reopen a finished order. */
export async function setOrderStatus(orderId: string, status: string, note?: string, admin = false) {
  const from = admin ? ["pending_payment", "placed", "accepted", "preparing", "ready", "picked_up"] : FROM[status];
  if (!from) return;
  const patch: Record<string, any> = { status };
  if (status === "accepted") patch.accepted_at = new Date().toISOString();
  if (status === "ready") patch.ready_at = new Date().toISOString();
  if (status === "picked_up") patch.picked_up_at = new Date().toISOString();
  if (status === "delivered") { patch.delivered_at = new Date().toISOString(); }
  const { data: o } = await db().from("orders").update(patch).eq("id", orderId).in("status", from).select("id,code,customer_id,driver_id,delivery_fee_paise,address,payment_method,payment_status,restaurants:jm_restaurants(name)").maybeSingle();
  if (!o) return; // already moved on (double tap, another device, or finished)
  if (status === "delivered" && o.payment_method === "cod") await db().from("orders").update({ payment_status: "cod_collected" }).eq("id", orderId);
  if (status === "delivered" && o.driver_id) await db().from("orders").update({ driver_pay_paise: riderPay(o.delivery_fee_paise, await getDriverCfg()) }).eq("id", orderId);
  await db().from("order_events").insert({ order_id: orderId, status, note: note || null });
  const msg: Record<string, string> = { accepted: "accepted your order", preparing: "is preparing your food", ready: "has your order ready for pickup", picked_up: "Your order is on its way", delivered: "Your order was delivered. Enjoy your meal!", rejected: "could not accept your order", cancelled: "Order cancelled" };
  if (msg[status]) await notify(o.customer_id, { title: `Order ${o.code}: ${status === "picked_up" || status === "delivered" || status === "cancelled" ? msg[status] : `${(o as any).restaurants?.name || "Restaurant"} ${msg[status]}`}`, body: note || undefined, href: `/order/${o.code}` });
  // Rider side: offer new orders to riders, tell the assigned rider when food is ready, release them if the order dies.
  const riderUser = o.driver_id ? (await db().from("drivers").select("user_id").eq("id", o.driver_id).maybeSingle()).data?.user_id : null;
  if (status === "accepted" && !o.driver_id) await announceToDrivers(o);
  if (status === "ready") {
    if (riderUser) await notify(riderUser, { title: `Order ${o.code} is ready`, body: `Pick it up from ${o.restaurants?.name || "the restaurant"}.`, href: "/driver" });
    else await announceToDrivers(o);
  }
  if ((status === "rejected" || status === "cancelled") && riderUser) await notify(riderUser, { title: `Order ${o.code} was cancelled`, body: "No pickup needed. Nothing is owed by you.", href: "/driver" });
  if ((status === "rejected" || status === "cancelled") && o.payment_status === "paid") await refundOrder(orderId);
}
