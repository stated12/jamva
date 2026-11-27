"use client";
import { useEffect, useState } from "react";
declare global { interface Window { __jvInstall?: any } }
/** Registers the service worker and shows a small "install the app" prompt once the browser allows it. */
export default function PwaBoot() {
  const [ev, setEv] = useState<any>(null); const [hide, setHide] = useState(true);
  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
    const h = (e: any) => { e.preventDefault(); setEv(e); try { if (!localStorage.getItem("jv-install-dismissed")) setHide(false); } catch { setHide(false); } };
    window.addEventListener("beforeinstallprompt", h); return () => window.removeEventListener("beforeinstallprompt", h);
  }, []);
  if (hide || !ev) return null;
  return (<div className="fixed inset-x-3 bottom-20 z-50 mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-ink p-3 text-white shadow-2xl"><img src="/icons/icon-192.png" alt="" className="h-11 w-11 rounded-xl" /><p className="flex-1 text-sm"><b>Install Jamva</b><br /><span className="text-white/70">Faster ordering and order alerts.</span></p>
    <button onClick={async () => { ev.prompt(); await ev.userChoice; setHide(true); }} className="rounded-full bg-kesar px-4 py-2 text-sm font-extrabold">Install</button>
    <button aria-label="Dismiss" onClick={() => { try { localStorage.setItem("jv-install-dismissed", "1"); } catch { /* ignore */ } setHide(true); }} className="px-1 text-xl text-white/60">×</button></div>);
}
