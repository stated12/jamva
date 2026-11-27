"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
export default function AutoRefresh({ every = 15000 }: { every?: number }) { const r = useRouter(); useEffect(() => { const t = setInterval(() => { if (!document.hidden) r.refresh(); }, every); return () => clearInterval(t); }, [r, every]); return null; }
