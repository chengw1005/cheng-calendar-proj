import type { Metadata } from "next";

import "./globals.css";
import { I18nProvider } from "@/lib/i18n-context";
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
    <html lang="en">
      <body>
        <I18nProvider>
          <LayoutShell>{children}</LayoutShell>
        </I18nProvider>
      </body>
    </html>
  );
}
