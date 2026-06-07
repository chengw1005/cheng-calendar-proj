"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";

import { useI18n } from "@/lib/i18n-context";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

function LoginForm() {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(searchParams.get("error") ? t("login.authError") : "");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = getSupabaseBrowserClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message === "Invalid login credentials" ? t("login.invalidCreds") : authError.message);
      setLoading(false);
      return;
    }

    router.push("/calendar");
    router.refresh();
  }

  return (
    <main className="authCard card">
      <h2 style={{ marginTop: 0, textAlign: "center" }}>{t("login.title")}</h2>

      <form onSubmit={(e) => void handleLogin(e)} className="authForm">
        <input
          type="email"
          placeholder={t("login.email")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder={t("login.password")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />
        {error ? <p className="authError">{error}</p> : null}
        <button type="submit" disabled={loading}>
          {loading ? t("login.loading") : t("login.submit")}
        </button>
      </form>

      <div className="authLinks">
        <Link href="/register">{t("login.noAccount")}</Link>
        <Link href="/forgot-password">{t("login.forgotPwd")}</Link>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
