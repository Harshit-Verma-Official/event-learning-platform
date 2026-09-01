"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  authApi,
  getErrorMessage,
  setAccessToken,
  type LoginResponse,
} from "../../lib/api";
import {
  AuthLink,
  AuthShell,
  Field,
  ResponseBox,
  SubmitButton,
} from "../../components/auth-ui";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<LoginResponse | null>(null);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await authApi.login({ email, password });
      setAccessToken(res.accessToken);
      setResponse(res);
      router.push("/dashboard");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Sign in"
      subtitle="POST /api/v1/auth/login — stores accessToken & refresh cookie"
      footer={
        <>
          Don&apos;t have an account? <AuthLink href="/signup">Create one</AuthLink>
          {" · "}
          <AuthLink href="/forgot-password">Forgot password?</AuthLink>
          {" · "}
          <AuthLink href="/account">Test /me & /refresh</AuthLink>
          {" · "}
          <AuthLink href="/dashboard">Dashboard</AuthLink>
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
        <Field
          label="Password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <SubmitButton loading={loading}>Sign in</SubmitButton>
      </form>
      <ResponseBox loading={loading} error={error} data={response} />
    </AuthShell>
  );
}
