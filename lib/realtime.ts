"use client";
import { createBrowserClient } from "@supabase/ssr";
let c: any = null;
/** One shared browser client (reads the same login cookies as the server). Returns null if the public keys are missing. */
export function rt(): any {
  if (c) return c;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  c = createBrowserClient(url, key);
  return c;
}
