/** Warm illustrated placeholder used wherever a restaurant or dish has no photo yet. Deterministic per seed so each card looks different. */
const PAL = [["#FFE0B2", "#FFB74D", "#E65100"], ["#FFF3C4", "#FFD54F", "#C77700"], ["#FFD9D0", "#FF8A65", "#BF360C"], ["#E3F1E8", "#81C995", "#1F6B43"], ["#F6E3C8", "#E0A96D", "#7B4A12"]];
export default function Art({ seed = "", kind = "plate", className = "" }: { seed?: string; kind?: "plate" | "bowl" | "cover"; className?: string }) {
  let h = 0; for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0; const p = PAL[h % PAL.length]; const id = "a" + (h % 9973);
  return (<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" className={className} role="img" aria-label="Illustration">
    <defs><linearGradient id={id} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={p[0]} /><stop offset="1" stopColor={p[1]} /></linearGradient></defs>
    <rect width="400" height="300" fill={`url(#${id})`} />
    <g opacity=".22" fill={p[2]}>{[0, 1, 2, 3, 4, 5, 6].map((i) => <circle key={i} cx={30 + i * 62 + (h % 17)} cy={i % 2 ? 40 : 262} r={14 + (i % 3) * 6} />)}</g>
    {kind === "cover" ? <g fill="#fff" opacity=".9"><path d="M70 190h260c0 44-52 78-130 78S70 234 70 190z" /><path d="M150 170c-16-18 16-30 0-54M200 170c-16-18 16-30 0-54M250 170c-16-18 16-30 0-54" stroke="#fff" strokeWidth="9" strokeLinecap="round" fill="none" /></g>
      : <g><circle cx="200" cy="155" r="82" fill="#fff" opacity=".95" /><circle cx="200" cy="155" r="62" fill={p[1]} opacity=".55" /><circle cx="178" cy="140" r="16" fill={p[2]} opacity=".75" /><circle cx="224" cy="150" r="13" fill="#fff" opacity=".8" /><circle cx="205" cy="180" r="15" fill={p[2]} opacity=".55" /></g>}
  </svg>);
}
