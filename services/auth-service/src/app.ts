import "dotenv/config";

import cookieParser from "cookie-parser";
import express from "express";
import pinoHttp from "pino-http";
import { logger } from "./lib/logger";
import { errorHandler } from "./middleware/error.middleware";
import authRoutes from "./routes/auth.routes";

export const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(pinoHttp({ logger }));

app.use("/api/v1/auth", authRoutes);

app.use(errorHandler);

app.get("/health", async (_req, res) => {
  res.json({
    service: "auth-service",
    status: "ok",
  });
});
