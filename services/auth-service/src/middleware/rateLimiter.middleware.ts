import type { NextFunction, Request, Response } from "express";
import { redis } from "../lib/redis";

interface RateLimitOptions {
  limit: number;
  windowSeconds: number;
}

export const rateLimiter = ({ limit, windowSeconds }: RateLimitOptions) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip ?? "unknown";
    const key = `rate-limit:${req.path}:${ip}`;
    const currentCount = await redis.incr(key);

    if (currentCount === 1) {
      await redis.expire(key, windowSeconds);
    }

    if (currentCount > limit) {
      return res.status(429).json({
        message: "Too many requests. Please try again later.",
      });
    }

    next();
  };
};
