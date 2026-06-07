"use client";

import Link from "next/link";
import { useState } from "react";

import { useI18n } from "@/lib/i18n-context";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function ForgotPasswordPage() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = getSupabaseBrowserClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });

    if (resetError) {
      setError(resetError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  return (
    <main className="authCard card">
      <h2 style={{ marginTop: 0, textAlign: "center" }}>{t("forgot.title")}</h2>

      {success ? (
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "var(--accent)" }}>
            {t("forgot.emailSent")} <strong>{email}</strong>。{t("forgot.checkInbox")}
          </p>
          <div className="authLinks">
            <Link href="/login">{t("forgot.backToLogin")}</Link>
          </div>
        </div>
      ) : (
        <>
          <p style={{ color: "var(--muted)", fontSize: "0.9rem", textAlign: "center" }}>
            {t("forgot.desc")}
          </p>
          <form onSubmit={(e) => void handleSubmit(e)} className="authForm">
            <input
              type="email"
              placeholder={t("login.email")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {error ? <p className="authError">{error}</p> : null}
            <button type="submit" disabled={loading}>
              {loading ? t("forgot.loading") : t("forgot.submit")}
            </button>
          </form>
          <div className="authLinks">
            <Link href="/login">{t("forgot.backToLogin")}</Link>
          </div>
        </>
      )}
    </main>
  );
}
