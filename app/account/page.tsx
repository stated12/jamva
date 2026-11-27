import { requireUser } from "@/lib/session";
import PushButton from "@/components/PushButton";
import { logout } from "../actions";
export const metadata = { title: "Account" };
export default async function Page() {
  const p = await requireUser("/account");
  return (<div className="wrap max-w-lg py-10"><h1 className="text-4xl">Account</h1><div className="card mt-6 space-y-2 p-5"><p><b>Name:</b> {p.full_name || "—"}</p><p><b>Email:</b> {p.email}</p><p><b>Mobile:</b> {p.phone || "—"}</p></div>
    <div className="card mt-4 p-5"><p className="font-bold">Phone alerts</p><p className="mb-3 text-sm text-muted">Get order updates even when Jamva is closed.</p><PushButton /></div>
    <form action={logout} className="mt-6"><button className="btn btn-line">Sign out</button></form></div>);
}
