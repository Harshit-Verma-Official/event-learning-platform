import "dotenv/config";

import cookieParser from "cookie-parser";
import express from "express";
import pinoHttp from "pino-http";
import { startOutboxWorker } from "./events/outbox.worker";
import { startUserEventConsumer } from "./events/user.consumer";
import { producer } from "./lib/kafka";
import { logger } from "./lib/logger";
import { prisma } from "./lib/prisma";
import { errorHandler } from "./middleware/error.middleware";
import courseRouter from "./routes/course.routes";
import purchaseRouter from "./routes/purchase.routes";

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(pinoHttp({ logger }));

app.use(courseRouter);
app.use(purchaseRouter);

app.use(errorHandler);

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

const startServer = async () => {
  await startUserEventConsumer();
  await producer.connect();

  startOutboxWorker();

  app.listen(PORT, () => {
    logger.info(`Course service running on port ${PORT}`);
  });
};

startServer();
