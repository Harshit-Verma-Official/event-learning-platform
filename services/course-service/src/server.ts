import { createLogger } from "@event-learning-platform/common";
import dotenv from "dotenv";
import express from "express";
import pinoHttp from "pino-http";
import { prisma } from "./lib/prisma";

dotenv.config();

const app = express();
const logger = createLogger({ serviceName: "course-service" });

app.use(express.json());
app.use(pinoHttp({ logger }));

app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      service: "course-service",
      status: "ok",
      database: "connected",
    });
  } catch {
    res.status(503).json({
      service: "course-service",
      status: "error",
      database: "disconnected",
    });
  }
});

const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
  logger.info(`Course service running on port ${PORT}`);
});
