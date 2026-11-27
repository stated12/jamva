"use server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { authClient } from "@/lib/supabase-server";
import { allow } from "@/lib/ratelimit";
import { clean, isPhone, normPhone } from "@/lib/format";
import { notifyAdmins } from "@/lib/notify";
const safeNext = (n: string) => (n.startsWith("/") && !n.startsWith("//") ? n : "/account");
export async function login(fd: FormData) {
  const next = safeNext(clean(fd.get("next"), 200) || "/account");
  if (!(await allow("login", 15, 600))) redirect(`/login?e=rate&next=${encodeURIComponent(next)}`);
  const { error } = await (await authClient()).auth.signInWithPassword({ email: clean(fd.get("email"), 120).toLowerCase(), password: String(fd.get("password") || "") });
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
  const phone = normPhone(clean(fd.get("phone"), 20)), email = clean(fd.get("email"), 120), kind = ["customer", "restaurant", "driver"].includes(String(fd.get("kind"))) ? String(fd.get("kind")) : "customer";
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
