import nodemailer from "nodemailer";
import webpush from "web-push";
import { db } from "./db";
import { SITE_URL } from "./env";
import { rupees } from "./format";
/** Notifications go out on every channel that is configured; missing channels are skipped silently and never block an order.
 *  1) In-app (always)  2) Web push (VAPID keys)  3) Email (SMTP)  4) WhatsApp (Meta Cloud API, approved template) */
type N = { title: string; body?: string; href?: string };
let mailer: any;
function smtp() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) return null;
  return (mailer ||= nodemailer.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587), secure: process.env.SMTP_PORT === "465", auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } }));
}
async function email(to: string, n: N) {
  const t = smtp(); if (!t || !to) return;
  const link = n.href ? `${SITE_URL}${n.href}` : SITE_URL;
  await t.sendMail({ from: process.env.SMTP_FROM || `Jamva <${process.env.SMTP_USER}>`, to, subject: n.title, text: `${n.body || ""}\n\n${link}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:480px"><h2 style="color:#D7391F;margin:0 0 8px">${esc(n.title)}</h2><p>${esc(n.body || "")}</p><p><a href="${link}" style="background:#F08A00;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">Open Jamva</a></p></div>` });
}
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));
async function push(userId: string, n: N) {
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY, priv = process.env.VAPID_PRIVATE_KEY; if (!pub || !priv) return;
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:support@jamva.in", pub, priv);
  const { data } = await db().from("push_subscriptions").select("*").eq("user_id", userId);
  await Promise.all((data || []).map(async (s: any) => {
    try { await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify({ title: n.title, body: n.body || "", href: n.href || "/" })); }
    catch (e: any) { if (e?.statusCode === 404 || e?.statusCode === 410) await db().from("push_subscriptions").delete().eq("id", s.id); }
  }));
}
/** WhatsApp Cloud API template message (business-initiated messages must use an approved template with {{1}} = order code, {{2}} = amount). */
export async function whatsappOrder(to: string | null | undefined, code: string, totalPaise: number) {
  const token = process.env.WHATSAPP_TOKEN, id = process.env.WHATSAPP_PHONE_ID, tpl = process.env.WHATSAPP_TEMPLATE_NEW_ORDER; if (!token || !id || !tpl || !to) return;
  const num = "91" + to.replace(/\D/g, "").replace(/^91/, "");
  try { await fetch(`https://graph.facebook.com/v20.0/${id}/messages`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to: num, type: "template", template: { name: tpl, language: { code: process.env.WHATSAPP_TEMPLATE_LANG || "en" }, components: [{ type: "body", parameters: [{ type: "text", text: code }, { type: "text", text: rupees(totalPaise) }] }] } }) }); } catch { /* never block */ }
}
export async function notify(userId: string | null | undefined, n: N) {
  if (!userId) return;
  try {
    await db().from("notifications").insert({ user_id: userId, title: n.title, body: n.body || null, href: n.href || null });
    const { data } = await db().auth.admin.getUserById(userId);
    await Promise.allSettled([push(userId, n), email(data?.user?.email || "", n)]);
  } catch (e: any) { console.error("[notify]", e?.message || e); }
}
export async function notifyAdmins(n: N) {
  try { const { data } = await db().from("profiles").select("id").eq("role", "admin"); await Promise.allSettled((data || []).map((a: any) => notify(a.id, n))); } catch { /* ignore */ }
}
