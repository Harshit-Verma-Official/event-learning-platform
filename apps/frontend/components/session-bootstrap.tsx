"use client";

import { useEffect } from "react";
import { bootstrapSession } from "../lib/api";

/**
 * Runs once on app mount to restore a session after a full page reload.
 * If a (httpOnly-cookie) session exists, it silently mints a fresh access
 * token via POST /refresh. Renders nothing.
 */
export function SessionBootstrap() {
  useEffect(() => {
    void bootstrapSession();
  }, []);

  return null;
}
