"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { authApi, getErrorMessage, type MessageResponse } from "../../lib/api";
import {
  AuthLink,
  AuthShell,
  Field,
  ResponseBox,
  SubmitButton,
} from "../../components/auth-ui";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const [token, setToken] = useState(searchParams.get("token") ?? "");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<MessageResponse | null>(null);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newPassword !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await authApi.resetPassword({ token, newPassword });
      setResponse(res);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Reset password"
      subtitle="POST /api/v1/auth/reset-password — use the token from the auth-service logs"
      footer={
        <>
          <AuthLink href="/login">Back to sign in</AuthLink>
          {" · "}
          <AuthLink href="/forgot-password">Request another token</AuthLink>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Field
          label="Reset token"
          type="text"
          required
          placeholder="paste token from auth-service logs"
          value={token}
          onChange={(e) => setToken(e.target.value)}
        />
        <Field
          label="New password"
          type="password"
          required
          autoComplete="new-password"
          placeholder="••••••••"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <Field
          label="Confirm new password"
          type="password"
          required
          autoComplete="new-password"
          placeholder="••••••••"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        <SubmitButton loading={loading}>Reset password</SubmitButton>
      </form>
      <p className="mt-4 rounded-lg border border-white/10 bg-slate-900/60 p-3 text-xs text-slate-400">
        You can also open this page as{" "}
        <code className="text-indigo-300">/reset-password?token=&lt;token&gt;</code>{" "}
        to prefill the token field.
      </p>
      <ResponseBox loading={loading} error={error} data={response} />
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
