import type { NextFunction, Request, Response } from "express";
import { createLogger } from "@event-learning-platform/common";

const logger = createLogger({ serviceName: "auth-service" });

const STATUS_BY_MESSAGE: Record<string, number> = {
  "User already exists": 409,
  "Invalid email or password": 401,
  "Invalid or expired refresh token": 401,
  "Invalid refresh token": 401,
  "Refresh token expired": 401,
  "Refresh token reuse detected": 401,
  "User not found": 404,
  "Invalid or expired password reset token": 400,
};

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const message = err instanceof Error ? err.message : "Internal server error";
  const status = STATUS_BY_MESSAGE[message] ?? 500;

  if (status >= 500) {
    // Keep server-side stack traces in the logs, never send them to clients.
    logger.error(err);
  }

  res.status(status).json({ message });
};
