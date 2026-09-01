// Public facade for the auth API client.
//
// The implementation lives in `lib/axios.ts`: an axios instance with a
// request interceptor (attaches the access token) and a response interceptor
// (auto-refreshes via POST /refresh on a 401 and replays the request).
export * from "./axios";
