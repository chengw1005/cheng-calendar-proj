"use client";

import Link from "next/link";
import { useState } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function ForgotPasswordPage() {
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
      <h2 style={{ marginTop: 0, textAlign: "center" }}>忘记密码</h2>

      {success ? (
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "var(--accent)" }}>
            重置密码的邮件已发送到 <strong>{email}</strong>，请查收邮箱并点击链接重置密码。
          </p>
          <div className="authLinks">
            <Link href="/login">返回登录</Link>
          </div>
        </div>
      ) : (
        <>
          <p style={{ color: "var(--muted)", fontSize: "0.9rem", textAlign: "center" }}>
            输入你的注册邮箱，我们会发送重置密码的链接。
          </p>
          <form onSubmit={(e) => void handleSubmit(e)} className="authForm">
            <input
              type="email"
              placeholder="邮箱地址"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {error ? <p className="authError">{error}</p> : null}
            <button type="submit" disabled={loading}>
              {loading ? "发送中..." : "发送重置邮件"}
            </button>
          </form>
          <div className="authLinks">
            <Link href="/login">返回登录</Link>
          </div>
        </>
      )}
    </main>
  );
}
