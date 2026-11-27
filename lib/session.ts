import { redirect } from "next/navigation";
import { db } from "./db";
import { currentUser } from "./supabase-server";
export type Profile = { id: string; email?: string; full_name: string | null; phone: string | null; role: string };
export async function getProfile(): Promise<Profile | null> {
  const u = await currentUser(); if (!u) return null;
  const { data } = await db().from("profiles").select("*").eq("id", u.id).maybeSingle();
  const isAdmin = !!u.email && (process.env.ADMIN_EMAILS || "avdhesh20@gmail.com").toLowerCase().split(",").map((s) => s.trim()).includes(u.email.toLowerCase());
  if (isAdmin && data?.role !== "admin") { try { await db().from("profiles").upsert({ id: u.id, role: "admin" }, { onConflict: "id" }); } catch { /* best effort */ } }
  return { id: u.id, email: u.email, full_name: data?.full_name ?? null, phone: data?.phone ?? null, role: isAdmin ? "admin" : data?.role || "customer" };
}
export async function requireUser(next = "/account"): Promise<Profile> { const p = await getProfile(); if (!p) redirect("/login?next=" + encodeURIComponent(next)); return p; }
export async function requireAdmin(): Promise<Profile> { const p = await requireUser("/admin"); if (p.role !== "admin") redirect("/"); return p; }
export async function myRestaurant() {
  const u = await currentUser(); if (!u) return null;
  const { data } = await db().from("restaurants").select("*").eq("owner_id", u.id).order("created_at").limit(1).maybeSingle();
  return data || null;
}
export async function requireRestaurant() {
  const p = await requireUser("/partner/dashboard"); const r = await myRestaurant();
  if (!r) redirect("/partner/register"); return { p, r };
}
