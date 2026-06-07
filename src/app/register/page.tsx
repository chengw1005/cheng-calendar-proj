"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useI18n } from "@/lib/i18n-context";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function RegisterPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError(t("reg.mismatch"));
      return;
    }

    setLoading(true);

    const supabase = getSupabaseBrowserClient();
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) {
      setError(t("reg.autoLoginFailed"));
      setLoading(false);
      return;
    }

    router.push("/calendar");
    router.refresh();
  }

  return (
    <main className="authCard card">
      <h2 style={{ marginTop: 0, textAlign: "center" }}>{t("reg.title")}</h2>

      <form onSubmit={(e) => void handleRegister(e)} className="authForm">
        <input
          type="email"
          placeholder={t("login.email")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder={t("reg.password")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />
        <input
          type="password"
          placeholder={t("reg.confirmPwd")}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={6}
        />
        {error ? <p className="authError">{error}</p> : null}
        <button type="submit" disabled={loading}>
          {loading ? t("reg.loading") : t("reg.submit")}
        </button>
      </form>

      <div className="authLinks">
        <Link href="/login">{t("reg.hasAccount")}</Link>
      </div>
    </main>
  );
}
