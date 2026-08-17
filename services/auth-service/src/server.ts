import "dotenv/config";

import { createLogger } from "@event-learning-platform/common";
import cookieParser from "cookie-parser";
import express from "express";
import pinoHttp from "pino-http";
import authRoutes from "./routes/auth.routes";

const app = express();
const logger = createLogger({ serviceName: "auth-service" });

app.use(express.json());
app.use(cookieParser());
app.use(pinoHttp({ logger }));

app.use("/api/v1/auth", authRoutes);

app.get("/health", async (_req, res) => {
  res.json({
    service: "auth-service",
    status: "ok",
  });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  logger.info(`Auth service running on port ${PORT}`);
});
