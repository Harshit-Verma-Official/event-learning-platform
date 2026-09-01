"use client";

import Link from "next/link";
import type { InputHTMLAttributes, ReactNode } from "react";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-linear-to-br from-slate-950 via-indigo-950 to-slate-900 p-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/20 text-2xl ring-1 ring-indigo-400/30">
            🎓
          </div>
          <h1 className="text-3xl font-bold text-white">{title}</h1>
          {subtitle ? (
            <p className="mt-2 text-sm text-slate-400">{subtitle}</p>
          ) : null}
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
          {children}
        </div>
        {footer ? (
          <div className="mt-6 text-center text-sm text-slate-400">{footer}</div>
        ) : null}
      </div>
    </main>
  );
}

export function Field({
  label,
  hint,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-300">
        {label}
      </span>
      <input
        {...props}
        className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/40"
      />
      {hint ? (
        <span className="mt-1 block text-xs text-slate-500">{hint}</span>
      ) : null}
    </label>
  );
}

export function SubmitButton({
  children,
  loading,
  disabled,
}: {
  children: ReactNode;
  loading?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={loading || disabled}
      className="w-full rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? "Loading…" : children}
    </button>
  );
}

export function ActionButton({
  children,
  onClick,
  loading,
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading || disabled}
      className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? "Loading…" : children}
    </button>
  );
}

export function ResponseBox({
  loading,
  error,
  data,
  label,
}: {
  loading: boolean;
  error: string | null;
  data: unknown;
  label?: string;
}) {
  if (loading) {
    return (
      <div className="mt-4 rounded-lg border border-white/10 bg-slate-900/60 p-4 font-mono text-sm text-indigo-300">
        Requesting…
      </div>
    );
  }
  if (error) {
    return (
      <div className="mt-4 rounded-lg border border-red-400/30 bg-red-500/10 p-4">
        <p className="mb-1 text-sm font-semibold text-red-300">
          {label ?? "Error"}
        </p>
        <pre className="whitespace-pre-wrap font-mono text-xs text-red-200">
          {error}
        </pre>
      </div>
    );
  }
  if (data !== undefined && data !== null) {
    return (
      <div className="mt-4 rounded-lg border border-emerald-400/30 bg-emerald-500/10 p-4">
        <p className="mb-1 text-sm font-semibold text-emerald-300">
          {label ?? "Response"}
        </p>
        <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-all font-mono text-xs text-emerald-200">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    );
  }
  return null;
}

export function AuthLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="font-medium text-indigo-400 transition hover:text-indigo-300"
    >
      {children}
    </Link>
  );
}
