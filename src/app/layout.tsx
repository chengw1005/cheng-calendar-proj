import type { Metadata } from "next";

import "./globals.css";
import { LayoutShell } from "./layout-shell";

export const metadata: Metadata = {
  title: "日历打卡",
  description: "每日活动打卡、日历记录与数据统计",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <LayoutShell>{children}</LayoutShell>
      </body>
    </html>
  );
}
