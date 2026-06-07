"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useI18n } from "@/lib/i18n-context";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function ResetPasswordPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError(t("reset.mismatch"));
      return;
    }

    setLoading(true);

    const supabase = getSupabaseBrowserClient();
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    router.push("/calendar");
    router.refresh();
  }

  return (
    <main className="authCard card">
      <h2 style={{ marginTop: 0, textAlign: "center" }}>{t("reset.title")}</h2>

      <form onSubmit={(e) => void handleReset(e)} className="authForm">
        <input
          type="password"
          placeholder={t("reset.newPwd")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />
        <input
          type="password"
          placeholder={t("reset.confirmPwd")}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={6}
        />
        {error ? <p className="authError">{error}</p> : null}
        <button type="submit" disabled={loading}>
          {loading ? t("reset.loading") : t("reset.submit")}
        </button>
      </form>

      <div className="authLinks">
        <Link href="/login">{t("reset.backToLogin")}</Link>
      </div>
    </main>
  );
}
