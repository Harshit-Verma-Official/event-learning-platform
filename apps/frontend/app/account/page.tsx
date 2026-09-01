"use client";

import { useState, useSyncExternalStore } from "react";
import {
  authApi,
  clearAccessToken,
  getAccessToken,
  getErrorMessage,
  getSessionStatus,
  setAccessToken,
  subscribeToAccessToken,
  subscribeToSessionStatus,
  type MeResponse,
  type RefreshResponse,
} from "../../lib/api";
import {
  ActionButton,
  AuthLink,
  AuthShell,
  ResponseBox,
} from "../../components/auth-ui";

export default function AccountPage() {
  // Live view of the access token store; re-renders whenever it changes.
  // getServerSnapshot returns null so SSR/hydration stay consistent.
  const accessToken = useSyncExternalStore(
    subscribeToAccessToken,
    getAccessToken,
    () => null
  );
  // Session status — used to show a "checking…" state instead of "None" while
  // the boot-time silent refresh is restoring the in-memory token.
  const sessionStatus = useSyncExternalStore(
    subscribeToSessionStatus,
    getSessionStatus,
    () => "idle"
  );
  // Only true after hydration; prevents a flash of "None" while the client
  // re-reads state after SSR.
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const [loadingMe, setLoadingMe] = useState(false);
  const [loadingRefresh, setLoadingRefresh] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meResponse, setMeResponse] = useState<MeResponse | null>(null);
  const [refreshResponse, setRefreshResponse] =
    useState<RefreshResponse | null>(null);

  const callMe = async () => {
    setLoadingMe(true);
    setError(null);
    setMeResponse(null);
    try {
      if (!accessToken) {
        throw new Error("No access token stored. Log in first.");
      }
      // The axios request interceptor attaches the access token automatically.
      const res = await authApi.me();
      setMeResponse(res);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoadingMe(false);
    }
  };

  const callRefresh = async () => {
    setLoadingRefresh(true);
    setError(null);
    setRefreshResponse(null);
    try {
      const res = await authApi.refresh();
      setAccessToken(res.accessToken);
      setRefreshResponse(res);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoadingRefresh(false);
    }
  };

  const clearToken = () => {
    clearAccessToken();
    setMeResponse(null);
    setRefreshResponse(null);
    setError(null);
  };

  return (
    <AuthShell
      title="Account"
      subtitle="Test GET /api/v1/auth/me and POST /api/v1/auth/refresh"
      footer={
        <>
          <AuthLink href="/login">Login</AuthLink>
          {" · "}
          <AuthLink href="/signup">Sign up</AuthLink>
          {" · "}
          <AuthLink href="/forgot-password">Forgot password</AuthLink>
          {" · "}
          <AuthLink href="/reset-password">Reset password</AuthLink>
          {" · "}
          <AuthLink href="/dashboard">Dashboard</AuthLink>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-lg border border-white/10 bg-slate-900/60 p-3">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Access token (in-memory)
          </p>
          {!hydrated || sessionStatus === "checking" ? (
            <p className="text-sm text-slate-500">Checking session…</p>
          ) : accessToken ? (
            <pre className="max-h-24 overflow-auto whitespace-pre-wrap break-all font-mono text-xs text-indigo-300">
              {accessToken}
            </pre>
          ) : (
            <p className="text-sm text-slate-500">
              None — log in first (or a silent refresh may restore it).
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <ActionButton onClick={callMe} loading={loadingMe}>
            GET /me
          </ActionButton>
          <ActionButton onClick={callRefresh} loading={loadingRefresh}>
            POST /refresh
          </ActionButton>
          <ActionButton onClick={clearToken} disabled={!accessToken}>
            Clear token
          </ActionButton>
        </div>

        <ResponseBox loading={loadingMe} error={error} data={meResponse} label="GET /me" />
        <ResponseBox
          loading={loadingRefresh}
          error={error}
          data={refreshResponse}
          label="POST /refresh"
        />
      </div>
    </AuthShell>
  );
}
