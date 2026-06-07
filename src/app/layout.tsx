import type { Metadata } from "next";
import Link from "next/link";

import "./globals.css";

export const metadata: Metadata = {
  title: "Online Calendar MVP",
  description: "Mark daily activities, search entries, and view stats.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <div className="container">
          {children}
          <nav className="card bottomNav" style={{ marginTop: "1rem" }}>
            <Link href="/calendar">月历</Link>
            <Link href="/activities">活动管理</Link>
            <Link href="/search">日期搜索</Link>
            <Link href="/stats">统计</Link>
          </nav>
        </div>
      </body>
    </html>
  );
}
