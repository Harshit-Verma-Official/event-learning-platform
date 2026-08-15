import { createLogger } from "@event-learning-platform/common";
import dotenv from "dotenv";
import express from "express";
import pinoHttp from "pino-http";
import { prisma } from "./lib/prisma";

dotenv.config();

const app = express();
const logger = createLogger({ serviceName: "auth-service" });

app.use(express.json());
app.use(pinoHttp({ logger }));

app.get("/health", async (_req, res) => {
  try {
    await prisma.user.findMany().then((result) => {
      res.json(result);
    });

    // res.json({
    //   service: "auth-service",
    //   status: "ok",
    //   database: "connected",
    // });
  } catch {
    res.status(503).json({
      service: "auth-service",
      status: "error",
      database: "disconnected",
    });
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  logger.info(`Auth service running on port ${PORT}`);
});
