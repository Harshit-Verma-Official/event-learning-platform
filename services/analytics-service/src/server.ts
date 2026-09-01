import "dotenv/config";

import express from "express";
import { startCourseAnalyticsConsumer } from "./consumers/course.consumer";
import { logger } from "./lib/logger";

const PORT = process.env.PORT || 3004;
const app = express();

app.listen(PORT, async () => {
  logger.info(`Analytics service running on port ${PORT}`);

  await startCourseAnalyticsConsumer();
});
