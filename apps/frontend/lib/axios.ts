import axios, { type AxiosError } from "axios";

// Allow marking retried requests on the axios config.
declare module "axios" {
  export interface InternalAxiosRequestConfig {
    _retry?: boolean;
  }
}

// ---- In-memory access token store ----
//
// The access token is deliberately NOT persisted (no localStorage). It lives
// in a module variable so XSS cannot steal it after a page reload. The only
// thing persisted is a non-sensitive "has_session" flag so a reload knows
// whether to attempt a silent refresh. The refresh token itself stays in an
// httpOnly cookie (invisible to JS).

const SESSION_FLAG_KEY = "has_session";

let accessToken: string | null = null;
let sessionStatus: SessionStatus = "idle";

const tokenListeners = new Set<() => void>();
const statusListeners = new Set<() => void>();

function notify(listeners: Set<() => void>): void {
  listeners.forEach((listener) => listener());
}

export type SessionStatus = "idle" | "checking" | "authenticated" | "anonymous";

export function subscribeToAccessToken(listener: () => void): () => void {
  tokenListeners.add(listener);
  return () => {
    tokenListeners.delete(listener);
  };
}

export function subscribeToSessionStatus(listener: () => void): () => void {
  statusListeners.add(listener);
  return () => {
    statusListeners.delete(listener);
  };
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function getSessionStatus(): SessionStatus {
  return sessionStatus;
}

export function setAccessToken(token: string): void {
  accessToken = token;
  sessionStatus = "authenticated";
  if (typeof window !== "undefined") {
    window.localStorage.setItem(SESSION_FLAG_KEY, "1");
  }
  notify(tokenListeners);
  notify(statusListeners);
}

export function clearAccessToken(): void {
  accessToken = null;
  sessionStatus = "anonymous";
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(SESSION_FLAG_KEY);
  }
  notify(tokenListeners);
  notify(statusListeners);
}

function hasSessionFlag(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(SESSION_FLAG_KEY) === "1";
}

// ---- Axios client with auth interceptors ----

export const apiClient = axios.create({
  baseURL: "/api/v1/auth",
  withCredentials: true, // send the httpOnly refreshToken cookie
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: attach the access token (if present) to every request.
apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Queue for requests that arrive while a refresh is in flight.
let isRefreshing = false;
let pendingQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

function flushQueue(error: unknown, token: string | null): void {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (token) resolve(token);
    else reject(error);
  });
  pendingQueue = [];
}

// Response interceptor: on a 401 from an authenticated request, try to
// refresh the access token via POST /refresh (rotates the refresh cookie),
// then replay the original request. Concurrent 401s are queued and replayed
// with the fresh token.
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config;
    const status = error.response?.status;
    const hasAuth = Boolean(original?.headers?.Authorization);
    const isRefreshCall = Boolean(original?.url?.includes("/refresh"));

    const shouldAttemptRefresh =
      status === 401 &&
      original &&
      hasAuth &&
      !original._retry &&
      !isRefreshCall;

    if (!shouldAttemptRefresh) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Another request is already refreshing; queue this one.
      return new Promise((resolve, reject) => {
        pendingQueue.push({
          resolve: (value) => {
            original._retry = true;
            original.headers.Authorization = `Bearer ${value as string}`;
            resolve(apiClient(original));
          },
          reject: (reason) => reject(reason),
        });
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const { data } = await apiClient.post<RefreshResponse>("/refresh");
      setAccessToken(data.accessToken);
      flushQueue(null, data.accessToken);
      original.headers.Authorization = `Bearer ${data.accessToken}`;
      return apiClient(original);
    } catch (refreshError) {
      flushQueue(refreshError, null);
      clearAccessToken();
      // Session is no longer valid; hard-redirect to login. This module is not
      // a React component so useRouter() is unavailable — an absolute URL is
      // used intentionally to force a full page navigation.
      if (typeof window !== "undefined") {
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.assign(`${window.location.origin}/login`);
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

// ---- Error helpers ----

export function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string } | undefined;
    return (
      data?.message ??
      `Request failed with status ${err.response?.status ?? "network error"}`
    );
  }
  if (err instanceof Error) return err.message;
  return String(err);
}

// ---- Types ----

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface LoginResponse {
  user: AuthUser;
  accessToken: string;
}

export interface RegisterResponse {
  user: AuthUser;
}

export interface MeResponse {
  user: AuthUser;
}

export interface RefreshResponse {
  accessToken: string;
}

export interface MessageResponse {
  message: string;
}

// ---- Auth API endpoints (axios-based) ----

export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    apiClient
      .post<RegisterResponse>("/register", data)
      .then((res) => res.data),
  login: (data: { email: string; password: string }) =>
    apiClient.post<LoginResponse>("/login", data).then((res) => res.data),
  refresh: () =>
    apiClient.post<RefreshResponse>("/refresh").then((res) => res.data),
  me: () => apiClient.get<MeResponse>("/me").then((res) => res.data),
  forgotPassword: (email: string) =>
    apiClient
      .post<MessageResponse>("/forgot-password", { email })
      .then((res) => res.data),
  resetPassword: (data: { token: string; newPassword: string }) =>
    apiClient
      .post<MessageResponse>("/reset-password", data)
      .then((res) => res.data),
};

// ---- Boot-time session restore ----
//
// The access token is in-memory only, so after a full page reload it is gone.
// If the (non-sensitive) session flag says a session may exist, silently call
// POST /refresh (uses the httpOnly cookie) to mint a fresh access token. The
// promise is memoized so multiple callers (layout + protected pages) share a
// single in-flight attempt.

let bootstrapPromise: Promise<void> | null = null;

export function bootstrapSession(): Promise<void> {
  if (bootstrapPromise) return bootstrapPromise;

  bootstrapPromise = (async () => {
    if (!hasSessionFlag()) {
      sessionStatus = "anonymous";
      notify(statusListeners);
      return;
    }

    sessionStatus = "checking";
    notify(statusListeners);

    try {
      const { data } = await apiClient.post<RefreshResponse>("/refresh");
      setAccessToken(data.accessToken);
    } catch {
      clearAccessToken();
    }
  })();

  return bootstrapPromise;
}

/** For tests / dev tools: allow re-running bootstrap on demand. */
export function resetBootstrap(): void {
  bootstrapPromise = null;
}
