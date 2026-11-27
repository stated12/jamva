import type { Metadata } from "next";
export const metadata: Metadata = { manifest: "/partner.webmanifest" };
export default function Layout({ children }: { children: React.ReactNode }) { return <>{children}</>; }
