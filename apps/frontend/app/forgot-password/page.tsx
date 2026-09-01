"use client";

import { useState } from "react";
import { authApi, getErrorMessage, type MessageResponse } from "../../lib/api";
import {
  AuthLink,
  AuthShell,
  Field,
  ResponseBox,
  SubmitButton,
} from "../../components/auth-ui";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<MessageResponse | null>(null);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await authApi.forgotPassword(email);
      setResponse(res);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Forgot password"
      subtitle="POST /api/v1/auth/forgot-password — reset token is logged by the auth-service console"
      footer={
        <>
          Remembered it? <AuthLink href="/login">Sign in</AuthLink>
          {" · "}
          <AuthLink href="/reset-password">Go to reset</AuthLink>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Field
          label="Email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <SubmitButton loading={loading}>Send reset link</SubmitButton>
      </form>
      <p className="mt-4 rounded-lg border border-white/10 bg-slate-900/60 p-3 text-xs text-slate-400">
        The auth-service logs the reset token with{" "}
        <code className="text-indigo-300">
          Password reset token for &lt;email&gt;: &lt;token&gt;
        </code>
        . Copy it into the reset page.
      </p>
      <ResponseBox loading={loading} error={error} data={response} />
    </AuthShell>
  );
}
