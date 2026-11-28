export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
export const supabaseUrl = () => process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
export const supabaseAnon = () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
export const supabaseService = () => process.env.SUPABASE_SERVICE_ROLE_KEY || "";
/** Only the two server variables are needed: the public checkout key is the same Key ID, so no NEXT_PUBLIC copy is required any more. */
export const razorpayConfigured = () => !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
export const razorpayKeyId = () => process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "";
export const razorpayMode = (): "test" | "live" | "unknown" => { const k = process.env.RAZORPAY_KEY_ID || ""; return k.startsWith("rzp_live_") ? "live" : k.startsWith("rzp_test_") ? "test" : "unknown"; };
export function envProblems(): string[] {
  const out: string[] = [];
  if (!supabaseUrl()) out.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!supabaseAnon()) out.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (!supabaseService()) out.push("SUPABASE_SERVICE_ROLE_KEY");
  return out;
}
export function requireEnv() { const p = envProblems(); if (p.length) throw new Error("Missing environment variables: " + p.join(", ")); }
