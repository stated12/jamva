import { NextResponse } from "next/server";
import { authClient } from "@/lib/supabase-server";
export const dynamic = "force-dynamic";
/** Email links (password reset) land here: the one-time code becomes a login session, then the visitor continues. */
export async function GET(req: Request) {
  const u = new URL(req.url); const code = u.searchParams.get("code"); const next = u.searchParams.get("next") || "/account";
  const safe = next.startsWith("/") && !next.startsWith("//") ? next : "/account";
  if (code) { const { error } = await (await authClient()).auth.exchangeCodeForSession(code); if (!error) return NextResponse.redirect(new URL(safe, u.origin)); }
  return NextResponse.redirect(new URL("/forgot?e=link", u.origin));
}
