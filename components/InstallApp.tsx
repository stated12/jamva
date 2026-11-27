"use client";
import { useEffect, useState } from "react";
/** Install button for a PWA: uses the browser install prompt where available and shows Add to Home Screen steps on iPhone. */
export default function InstallApp({ label, className = "btn btn-primary" }: { label: string; className?: string }) {
  const [ev, setEv] = useState<any>(null); const [ios, setIos] = useState(false); const [installed, setInstalled] = useState(false); const [help, setHelp] = useState(false);
  useEffect(() => {
    const ua = navigator.userAgent; setIos(/iPhone|iPad|iPod/i.test(ua) && !(window as any).MSStream);
    setInstalled(window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone === true);
    const h = (e: any) => { e.preventDefault(); setEv(e); }; window.addEventListener("beforeinstallprompt", h);
    const d = () => setInstalled(true); window.addEventListener("appinstalled", d);
    return () => { window.removeEventListener("beforeinstallprompt", h); window.removeEventListener("appinstalled", d); };
  }, []);
  if (installed) return <span className="chip bg-leaf-soft text-leaf">✓ App installed on this device</span>;
  async function go() { if (ev) { ev.prompt(); await ev.userChoice; setEv(null); } else setHelp(true); }
  return (<div><button onClick={go} className={className}>{label}</button>
    {help && <div className="mt-3 max-w-sm rounded-xl bg-soft p-3 text-sm text-ink">{ios ? <>On iPhone: tap the <b>Share</b> button in Safari, then <b>Add to Home Screen</b>.</> : <>Open your browser menu (⋮) and tap <b>Install app</b> or <b>Add to Home screen</b>. If you do not see it, open this page in Chrome.</>}</div>}</div>);
}
