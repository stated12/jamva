import Link from "next/link";
import { register } from "../actions";
export const metadata = { title: "Create account" };
const MSG: Record<string, string> = { invalid: "Please check your details. Password needs at least 8 characters and the mobile number must be valid.", exists: "An account with this email already exists. Please sign in.", create: "Could not create the account. Please try again.", rate: "Too many attempts. Please try later." };
export default async function Page({ searchParams }: { searchParams: Promise<{ e?: string; next?: string }> }) {
  const sp = await searchParams; const next = sp.next || "/account";
  return (<div className="wrap max-w-md py-14"><h1 className="text-4xl">Create your account</h1><p className="mt-1 text-muted">Takes a minute. Your mobile number is used only for delivery.</p>
    <form action={register} className="card mt-6 space-y-4 p-5"><input type="hidden" name="next" value={next} />{sp.e && <p className="rounded-xl bg-soft p-3 text-sm font-semibold text-chilli">{MSG[sp.e] || MSG.invalid}</p>}
      <div><label className="label">Full name</label><input name="name" required className="input" autoComplete="name" /></div><div><label className="label">Mobile number</label><input name="phone" required inputMode="tel" className="input" autoComplete="tel" /></div>
      <div><label className="label">Email</label><input name="email" type="email" required className="input" autoComplete="email" /></div><div><label className="label">Password (8+ characters)</label><input name="password" type="password" required minLength={8} className="input" autoComplete="new-password" /></div>
      <button className="btn btn-primary w-full">Create account</button></form><p className="mt-4 text-center text-sm">Already have an account? <Link href={`/login?next=${encodeURIComponent(next)}`} className="font-extrabold text-chilli">Sign in</Link></p></div>);
}
