import cookieParser from "cookie-parser";
import express from "express";
import pinoHttp from "pino-http";
import swaggerUi from "swagger-ui-express";
import { swaggerDocument } from "./config/swagger";
import { logger } from "./lib/logger";
import { errorHandler } from "./middleware/error.middleware";
import courseRouter from "./routes/course.routes";
import purchaseRouter from "./routes/purchase.routes";

export const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(pinoHttp({ logger }));

app.get("/health", async (_req, res) => {
  return res.status(200).json({
    status: "ok",
    service: "course-service",
  });
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(courseRouter);
app.use(purchaseRouter);

app.use(errorHandler);
