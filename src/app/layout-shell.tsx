"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

const authPages = ["/login", "/register", "/forgot-password", "/reset-password"];

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  const isAuthPage = authPages.some((p) => pathname.startsWith(p));

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null);
      setChecked(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function handleLogout() {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  async function handleDeleteAccount() {
    const confirmed = window.confirm(
      "确认要注销账户吗？所有数据将被永久删除，此操作不可撤销。"
    );
    if (!confirmed) return;

    const res = await fetch("/api/account", { method: "DELETE" });
    if (res.ok) {
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } else {
      alert("注销失败，请稍后重试。");
    }
  }

  return (
    <div className="container">
      {!isAuthPage && checked && userEmail ? (
        <header className="topBar">
          <span style={{ fontSize: "0.85rem", color: "var(--muted)" }}>{userEmail}</span>
          <button type="button" className="secondary" style={{ fontSize: "0.8rem", padding: "0.35rem 0.7rem" }} onClick={() => void handleLogout()}>
            退出登录
          </button>
          <button type="button" className="danger" style={{ fontSize: "0.8rem", padding: "0.35rem 0.7rem" }} onClick={() => void handleDeleteAccount()}>
            注销账户
          </button>
        </header>
      ) : null}

      {children}

      {!isAuthPage ? (
        <nav className="card bottomNav" style={{ marginTop: "1rem" }}>
          <Link href="/calendar">月历</Link>
          <Link href="/activities">活动管理</Link>
          <Link href="/search">日期搜索</Link>
          <Link href="/stats">统计</Link>
        </nav>
      ) : null}
    </div>
  );
}
