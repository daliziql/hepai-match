import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const incoming = await headers();
  const host = incoming.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const origin = `${protocol}://${host}`;
  const title = "合拍｜婚恋条件评估与匹配工具";
  const description = "用直观的稀缺度曲线看见自己的条件位置，并找到更现实的匹配区间。";
  return {
    title,
    description,
    icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
    openGraph: { title, description, type: "website", images: [{ url: `${origin}/og-v3.png`, width: 1731, height: 909, alt: "合拍 婚恋条件匹配工具" }] },
    twitter: { card: "summary_large_image", title, description, images: [`${origin}/og-v3.png`] },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
