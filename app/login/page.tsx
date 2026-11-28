import Link from "next/link";
import { login } from "../actions";
import { getT } from "@/lib/i18n";
export const metadata = { title: "Sign in" };
export default async function Page({ searchParams }: { searchParams: Promise<{ e?: string; next?: string }> }) {
  const sp = await searchParams; const { t } = await getT(); const next = sp.next || "/account";
  return (<div className="wrap max-w-md py-14"><h1 className="text-4xl">{t("lg_title")}</h1><p className="mt-1 text-muted">{t("lg_sub")}</p>
    <form action={login} className="card mt-6 space-y-4 p-5"><input type="hidden" name="next" value={next} />{sp.e === "bad" && <p className="rounded-xl bg-soft p-3 text-sm font-semibold text-chilli">{t("lg_bad")}</p>}{sp.e === "rate" && <p className="rounded-xl bg-soft p-3 text-sm font-semibold text-chilli">{t("lg_rate")}</p>}
      <div><label className="label">{t("email")}</label><input name="email" type="email" required className="input" autoComplete="email" /></div><div><label className="label">{t("password")}</label><input name="password" type="password" required className="input" autoComplete="current-password" /></div><button className="btn btn-primary w-full">{t("signin_btn")}</button></form>
    <p className="mt-3 text-center text-sm"><Link href="/forgot" className="font-bold text-chilli">{t("forgot")}</Link></p><p className="mt-4 text-center text-sm">{t("lg_new")} <Link href={`/register?next=${encodeURIComponent(next)}`} className="font-extrabold text-chilli">{t("lg_create")}</Link></p></div>);
}
