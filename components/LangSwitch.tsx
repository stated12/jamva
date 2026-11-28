"use client";
import { usePathname } from "next/navigation";
import { setLang } from "@/app/actions";
/** English / Hindi / Gujarati switch. Remembers the choice in a cookie. */
export default function LangSwitch({ current }: { current: string }) {
  const path = usePathname() || "/";
  return (<form action={setLang} className="flex items-center gap-0.5 rounded-full border border-line bg-white p-0.5 text-xs font-extrabold"><input type="hidden" name="next" value={path} />
    {([["en", "EN"], ["hi", "हि"], ["gu", "ગુ"]] as const).map(([v, l]) => <button key={v} name="lang" value={v} aria-label={v} className={`rounded-full px-2 py-1 ${current === v ? "bg-ink text-white" : "text-ink"}`}>{l}</button>)}</form>);
}
