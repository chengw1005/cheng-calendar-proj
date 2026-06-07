"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useI18n } from "@/lib/i18n-context";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

const authPages = ["/login", "/register", "/forgot-password", "/reset-password"];

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { locale, setLocale, t } = useI18n();
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
    const confirmed = window.confirm(t("nav.confirmDelete"));
    if (!confirmed) return;

    const res = await fetch("/api/account", { method: "DELETE" });
    if (res.ok) {
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } else {
      alert(t("nav.deleteFailed"));
    }
  }

  function toggleLocale() {
    setLocale(locale === "en" ? "zh" : "en");
  }

  return (
    <div className="container">
      {!isAuthPage && checked && userEmail ? (
        <header className="topBar">
          <button
            type="button"
            className="secondary"
            style={{ fontSize: "0.8rem", padding: "0.35rem 0.7rem", marginRight: "auto" }}
            onClick={toggleLocale}
          >
            {locale === "en" ? "中文" : "EN"}
          </button>
          <span style={{ fontSize: "0.85rem", color: "var(--muted)" }}>{userEmail}</span>
          <button type="button" className="secondary" style={{ fontSize: "0.8rem", padding: "0.35rem 0.7rem" }} onClick={() => void handleLogout()}>
            {t("nav.logout")}
          </button>
          <button type="button" className="danger" style={{ fontSize: "0.8rem", padding: "0.35rem 0.7rem" }} onClick={() => void handleDeleteAccount()}>
            {t("nav.deleteAccount")}
          </button>
        </header>
      ) : null}

      {children}

      {!isAuthPage ? (
        <nav className="card bottomNav" style={{ marginTop: "1rem" }}>
          <Link href="/calendar">{t("nav.calendar")}</Link>
          <Link href="/activities">{t("nav.activities")}</Link>
          <Link href="/search">{t("nav.search")}</Link>
          <Link href="/stats">{t("nav.stats")}</Link>
        </nav>
      ) : null}
    </div>
  );
}
