import "dotenv/config";

import { createLogger } from "@event-learning-platform/common";
import express from "express";
import { startCourseConsumer } from "./consumers/course.consumer";
import { startUserConsumer } from "./consumers/user.consumer";

const logger = createLogger({
  serviceName: "notification-service",
});
const app = express();

const PORT = process.env.PORT || 3003;

app.listen(PORT, async () => {
  logger.info(`Notification Service running on ${PORT}`);

  await startCourseConsumer();
  await startUserConsumer();
});
