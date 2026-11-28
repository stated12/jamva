"use client";
import { useState } from "react";
/** Locality box with suggestions for the chosen city. Picking a suggestion fills the PIN; anything can still be typed. */
export default function LocalityFields({ areas, labels }: { areas: { name: string; pincode?: string | null }[]; labels: { locality: string; pin: string } }) {
  const [pin, setPin] = useState("");
  return (<>
    <div><label className="label">{labels.locality}</label><input name="area" list="jv-localities" autoComplete="off" className="input" onChange={(e) => { const m = areas.find((a) => a.name.toLowerCase() === e.target.value.trim().toLowerCase()); if (m?.pincode) setPin(m.pincode); }} />
      <datalist id="jv-localities">{areas.map((a) => <option key={a.name + a.pincode} value={a.name}>{a.pincode || ""}</option>)}</datalist></div>
    <div><label className="label">{labels.pin}</label><input name="pincode" inputMode="numeric" maxLength={6} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} className="input" /></div></>);
}
