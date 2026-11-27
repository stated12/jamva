import crypto from "node:crypto";

const API = "https://api.razorpay.com/v1";
const auth = () => "Basic " + Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64");
async function call(path: string, method = "GET", body?: any): Promise<any> {
  const res = await fetch(API + path, { method, headers: { Authorization: auth(), "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined, cache: "no-store" });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(j?.error?.description || `Razorpay error ${res.status}`);
  return j;
}
export const toPaise = (rupees: number) => Math.round(rupees * 100);

export const createRzpOrder = (amountRupees: number, receipt: string, notes: Record<string, string> = {}) =>
  call("/orders", "POST", { amount: toPaise(amountRupees), currency: "INR", receipt: receipt.slice(0, 40), notes });
export const fetchRzpPayment = (id: string) => call(`/payments/${encodeURIComponent(id)}`);
export const fetchRzpOrderPayments = (orderId: string) => call(`/orders/${encodeURIComponent(orderId)}/payments`);
export const refundRzpPayment = (paymentId: string, amountRupees: number, notes: Record<string, string> = {}) =>
  call(`/payments/${encodeURIComponent(paymentId)}/refund`, "POST", { amount: toPaise(amountRupees), notes });

function safeEq(a: string, b: string) {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}
/** Checkout signature: HMAC_SHA256(order_id + "|" + payment_id, key_secret). */
export function verifyCheckoutSignature(orderId: string, paymentId: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET || "";
  if (!secret || !signature) return false;
  return safeEq(crypto.createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex"), signature);
}
/** Webhook signature: HMAC_SHA256(raw body, webhook_secret). */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || "";
  if (!secret || !signature) return false;
  return safeEq(crypto.createHmac("sha256", secret).update(rawBody).digest("hex"), signature);
}
