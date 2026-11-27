import Link from "next/link";
import { login } from "../actions";
export const metadata = { title: "Sign in" };
export default async function Page({ searchParams }: { searchParams: Promise<{ e?: string; next?: string }> }) {
  const sp = await searchParams; const next = sp.next || "/account";
  return (<div className="wrap max-w-md py-14"><h1 className="text-4xl">Welcome back</h1><p className="mt-1 text-muted">Sign in to order, track and manage your restaurant.</p>
    <form action={login} className="card mt-6 space-y-4 p-5"><input type="hidden" name="next" value={next} />{sp.e === "bad" && <p className="rounded-xl bg-soft p-3 text-sm font-semibold text-chilli">Wrong email or password.</p>}{sp.e === "rate" && <p className="rounded-xl bg-soft p-3 text-sm font-semibold text-chilli">Too many attempts. Please wait a few minutes.</p>}
      <div><label className="label">Email</label><input name="email" type="email" required className="input" autoComplete="email" /></div><div><label className="label">Password</label><input name="password" type="password" required className="input" autoComplete="current-password" /></div><button className="btn btn-primary w-full">Sign in</button></form>
    <p className="mt-4 text-center text-sm">New to Jamva? <Link href={`/register?next=${encodeURIComponent(next)}`} className="font-extrabold text-chilli">Create an account</Link></p></div>);
}
