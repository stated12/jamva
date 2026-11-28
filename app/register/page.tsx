import Link from "next/link";
import { register } from "../actions";
import { getT } from "@/lib/i18n";
export const metadata = { title: "Create account" };
export default async function Page({ searchParams }: { searchParams: Promise<{ e?: string; next?: string }> }) {
  const sp = await searchParams; const { t } = await getT(); const MSG: Record<string, string> = { invalid: t("rg_invalid"), exists: t("rg_exists"), create: t("rg_fail"), rate: t("h_rate") }; const next = sp.next || "/account";
  return (<div className="wrap max-w-md py-14"><h1 className="text-4xl">{t("rg_title")}</h1><p className="mt-1 text-muted">{t("rg_sub")}</p>
    <form action={register} className="card mt-6 space-y-4 p-5"><input type="hidden" name="next" value={next} />{sp.e && <p className="rounded-xl bg-soft p-3 text-sm font-semibold text-chilli">{MSG[sp.e] || MSG.invalid}</p>}
      <div><label className="label">{t("full_name")}</label><input name="name" required className="input" autoComplete="name" /></div><div><label className="label">{t("mobile")}</label><input name="phone" required inputMode="tel" className="input" autoComplete="tel" /></div>
      <div><label className="label">{t("email")}</label><input name="email" type="email" required className="input" autoComplete="email" /></div><div><label className="label">{t("pw8")}</label><input name="password" type="password" required minLength={8} className="input" autoComplete="new-password" /></div>
      <button className="btn btn-primary w-full">{t("rg_btn")}</button></form><p className="mt-4 text-center text-sm">{t("rg_have")} <Link href={`/login?next=${encodeURIComponent(next)}`} className="font-extrabold text-chilli">{t("signin_btn")}</Link></p></div>);
}
