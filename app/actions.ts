"use server";
import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { db } from "@/lib/db";
import { authClient } from "@/lib/supabase-server";
import { allow } from "@/lib/ratelimit";
import { clean, isPhone, normPhone } from "@/lib/format";
import { notifyAdmins } from "@/lib/notify";
import { resolveCity } from "@/lib/data";
const safeNext = (n: string) => (n.startsWith("/") && !n.startsWith("//") ? n : "/account");
export async function login(fd: FormData) {
  const next = safeNext(clean(fd.get("next"), 200) || "/account");
  if (!(await allow("login", 15, 600))) redirect(`/login?e=rate&next=${encodeURIComponent(next)}`);
  const em = clean(fd.get("email"), 120).toLowerCase();
  if (!(await allow("loginmail", 8, 600, em))) redirect(`/login?e=rate&next=${encodeURIComponent(next)}`); // per-email limit: stops guessing from many IPs
  const { error } = await (await authClient()).auth.signInWithPassword({ email: em, password: String(fd.get("password") || "") });
  if (error) redirect(`/login?e=bad&next=${encodeURIComponent(next)}`);
  redirect(next);
}
/** Creates a verified account straight away (no email round-trip), then signs the person in. Limited per IP; restaurants still need admin approval. */
export async function createAccount(email: string, password: string, name: string, phone: string): Promise<string | null> {
  const { error } = await db().auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: name, phone } });
  if (error && !/already|registered|exists/i.test(error.message)) return "create";
  if (error) return "exists";
  return null;
}
export async function register(fd: FormData) {
  const next = safeNext(clean(fd.get("next"), 200) || "/account");
  if (!(await allow("register", 6, 3600))) redirect(`/register?e=rate&next=${encodeURIComponent(next)}`);
  const email = clean(fd.get("email"), 120).toLowerCase(), password = String(fd.get("password") || ""), name = clean(fd.get("name"), 80), phone = normPhone(clean(fd.get("phone"), 20));
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || password.length < 8 || name.length < 2 || !isPhone(phone)) redirect(`/register?e=invalid&next=${encodeURIComponent(next)}`);
  const err = await createAccount(email, password, name, phone); if (err) redirect(`/register?e=${err}&next=${encodeURIComponent(next)}`);
  const { error } = await (await authClient()).auth.signInWithPassword({ email, password });
  redirect(error ? "/login" : next);
}
export async function logout() { await (await authClient()).auth.signOut(); redirect("/"); }
export async function joinWaitlist(fd: FormData) {
  if (!(await allow("waitlist", 8, 3600))) redirect("/?w=rate#waitlist");
  const phone = normPhone(clean(fd.get("phone"), 20)), email = clean(fd.get("email"), 120), kind = ["customer", "restaurant", "vendor", "driver"].includes(String(fd.get("kind"))) ? String(fd.get("kind")) : "customer";
  if (!isPhone(phone) && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) redirect("/?w=bad#waitlist");
  await db().from("waitlist").insert({ name: clean(fd.get("name"), 80) || null, phone: isPhone(phone) ? phone : null, email: email || null, area_slug: clean(fd.get("area"), 40) || null, kind });
  if (kind !== "customer") await notifyAdmins({ title: `New ${kind} interest`, body: clean(fd.get("name"), 80) || phone || email, href: "/admin" });
  redirect(kind === "driver" ? "/drivers?w=ok" : "/?w=ok#waitlist");
}
export async function sendContact(fd: FormData) {
  if (!(await allow("contact", 5, 3600))) redirect("/contact?e=rate");
  const message = clean(fd.get("message"), 2000); if (message.length < 5) redirect("/contact?e=bad");
  await db().from("contact_messages").insert({ name: clean(fd.get("name"), 80), email: clean(fd.get("email"), 120), phone: clean(fd.get("phone"), 20), message });
  await notifyAdmins({ title: "New contact message", body: message.slice(0, 120), href: "/admin" });
  redirect("/contact?ok=1");
}
/** Lead from a city where Jamva is not live (or a quick interest form). Stored in the waitlist with city and PIN so demand per city can be ranked. */
export async function saveLead(fd: FormData) {
  if (!(await allow("lead", 8, 3600))) redirect("/join?e=rate");
  const role = ["restaurant", "vendor", "driver"].includes(String(fd.get("role"))) ? String(fd.get("role")) : "restaurant";
  const name = clean(fd.get("name"), 80), phone = normPhone(clean(fd.get("phone"), 20)), geo = await resolveCity(clean(fd.get("city"), 60));
  const back = role === "driver" ? "/driver/register" : role === "vendor" ? "/street-vendors/join" : "/partner/register";
  if (name.length < 2 || !isPhone(phone)) redirect(`${back}?city=${encodeURIComponent(geo.name)}&e=lead`);
  const pin = clean(fd.get("pincode"), 6).replace(/\D/g, "");
  const details = { business: clean(fd.get("business"), 80), category: clean(fd.get("category"), 40), cuisine: clean(fd.get("cuisine"), 120), fssai_status: clean(fd.get("fssai_status"), 10), vehicle: clean(fd.get("vehicle"), 40), licence_status: clean(fd.get("licence_status"), 10), shift: clean(fd.get("shift"), 30) };
  await db().from("waitlist").insert({ name, phone, kind: role, city: geo.name, pincode: pin || null, area_slug: clean(fd.get("area"), 60) || null, details, status: "new" });
  await notifyAdmins({ title: `New ${role} lead: ${geo.name}`, body: `${name} · ${phone}`, href: "/admin/leads" });
  redirect(`/joined?city=${encodeURIComponent(geo.name)}&role=${role}&live=${geo.live ? 1 : 0}`);
}
export async function setLang(fd: FormData) {
  const v = String(fd.get("lang") || "en"), lang = v === "hi" || v === "gu" ? v : "en";
  (await cookies()).set("jv_lang", lang, { path: "/", maxAge: 31536000, sameSite: "lax" });
  redirect(safeNext(clean(fd.get("next"), 200) || "/"));
}

/** Password recovery step 1: Supabase emails a reset link. The answer is always the same so nobody can discover which emails have accounts. */
export async function requestReset(fd: FormData) {
  if (!(await allow("reset", 5, 3600))) redirect("/forgot?e=rate");
  const email = clean(fd.get("email"), 120).toLowerCase();
  if (email.includes("@")) {
    const h = await headers(); const origin = process.env.NEXT_PUBLIC_SITE_URL || `https://${h.get("x-forwarded-host") || h.get("host")}`;
    try { await (await authClient()).auth.resetPasswordForEmail(email, { redirectTo: `${origin}/auth/callback?next=/reset` }); } catch (e: any) { console.error("[reset] failed:", e?.message || e); }
  }
  redirect("/forgot?sent=1");
}
/** Password recovery step 2: the signed-in (via link) user picks a new password. */
export async function setNewPassword(fd: FormData) {
  const pw = String(fd.get("password") || ""); if (pw.length < 8 || pw !== String(fd.get("again") || "")) redirect("/reset?e=invalid");
  const { error } = await (await authClient()).auth.updateUser({ password: pw });
  if (error) redirect("/reset?e=expired");
  redirect("/account?pw=1");
}
