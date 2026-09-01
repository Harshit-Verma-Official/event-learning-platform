"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import {
  authApi,
  bootstrapSession,
  clearAccessToken,
  getAccessToken,
  getErrorMessage,
  getSessionStatus,
  subscribeToAccessToken,
  subscribeToSessionStatus,
  type AuthUser,
} from "../../lib/api";

export default function DashboardPage() {
  const router = useRouter();
  // Live view of the access token; getServerSnapshot keeps SSR/hydration stable.
  const accessToken = useSyncExternalStore(
    subscribeToAccessToken,
    getAccessToken,
    () => null
  );
  // Session status (idle | checking | authenticated | anonymous) — lets the
  // gate wait for the boot-time silent refresh instead of wrongly bouncing to
  // /login while the in-memory token is being restored.
  const sessionStatus = useSyncExternalStore(
    subscribeToSessionStatus,
    getSessionStatus,
    () => "idle"
  );
  // Flips to true only after React hydrates on the client.
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMe = useCallback(async () => {
    setError(null);
    try {
      // The axios request interceptor attaches the token; on a 401 the
      // response interceptor refreshes it and replays this request.
      const res = await authApi.me();
      setUser(res.user);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  // Auth gate: wait for hydration, then:
  //  - token present        → load the profile
  //  - no token, checking   → wait for the boot-time refresh
  //  - no token, idle       → kick off the boot-time refresh
  //  - no token, anonymous  → redirect to /login
  // The fetch is done inline (async IIFE) so every setState happens after an
  // await — this keeps the react-hooks/set-state-in-effect rule happy.
  useEffect(() => {
    if (!hydrated) return;
    if (!accessToken) {
      if (sessionStatus === "checking") return;
      if (sessionStatus === "idle") {
        void bootstrapSession();
        return;
      }
      router.replace("/login");
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const res = await authApi.me();
        if (!cancelled) setUser(res.user);
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrated, accessToken, sessionStatus, router]);

  const handleRefresh = () => {
    setLoading(true);
    void fetchMe();
  };

  const handleLogout = () => {
    clearAccessToken();
    router.push("/login");
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  return (
    <main className="min-h-screen bg-linear-to-br from-slate-950 via-indigo-950 to-slate-900 text-white">
      {/* Top bar */}
      <header className="border-b border-white/10 bg-white/5 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/20 text-lg ring-1 ring-indigo-400/30">
              🎓
            </div>
            <span className="text-lg font-semibold">Event Learning Platform</span>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <span className="text-slate-400">
              Signed in as{" "}
              <span className="font-medium text-white">{user?.email ?? "…"}</span>
            </span>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Log out
            </button>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            {loading ? "Loading your dashboard…" : `Welcome back, ${user?.name ?? ""}`}
          </h1>
          <p className="mt-2 text-slate-400">
            This page loads{" "}
            <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs text-indigo-300">
              GET /api/v1/auth/me
            </code>{" "}
            through the axios client. If the access token expires, the response
            interceptor silently refreshes it via{" "}
            <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs text-indigo-300">
              POST /api/v1/auth/refresh
            </code>{" "}
            and replays the request.
          </p>
        </div>

        {error ? (
          <div className="mb-6 rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <div className="grid gap-6 md:grid-cols-3">
          {/* Profile card */}
          <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <div className="mb-4 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-500/30 text-xl font-bold ring-2 ring-indigo-400/40">
                {initials}
              </div>
              <div>
                <p className="text-lg font-semibold">{user?.name ?? "—"}</p>
                <p className="text-sm text-slate-400">{user?.email ?? "—"}</p>
              </div>
            </div>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between border-t border-white/10 pt-2">
                <dt className="text-slate-400">Role</dt>
                <dd className="font-medium">{user?.role ?? "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">User ID</dt>
                <dd className="max-w-[55%] truncate font-mono text-xs" title={user?.id}>
                  {user?.id ?? "—"}
                </dd>
              </div>
            </dl>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="mt-5 w-full rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Fetching…" : "Refresh profile (GET /me)"}
            </button>
          </section>

          {/* Access token card */}
          <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur md:col-span-2">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
              Access token (auto-attached by interceptor)
            </h2>
            <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-all rounded-lg border border-white/10 bg-slate-900/60 p-3 font-mono text-xs text-indigo-300">
              {accessToken ?? "No access token — redirecting to login…"}
            </pre>

            <h2 className="mb-3 mt-6 text-sm font-semibold uppercase tracking-wider text-slate-400">
              How the interceptor works
            </h2>
            <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-300">
              <li>
                Request interceptor attaches{" "}
                <code className="text-indigo-300">Authorization: Bearer &lt;token&gt;</code>.
              </li>
              <li>
                A <code className="text-indigo-300">401</code> on an authenticated request
                triggers <code className="text-indigo-300">POST /refresh</code> (rotates the
                refresh cookie).
              </li>
              <li>
                Concurrent 401s are queued and replayed with the fresh token.
              </li>
              <li>
                If refresh fails, the token is cleared and you&apos;re sent back to{" "}
                <code className="text-indigo-300">/login</code>.
              </li>
            </ol>
          </section>
        </div>
      </div>
    </main>
  );
}
