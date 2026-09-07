import "dotenv/config";

import { app } from "./app";
import { startOutboxWorker } from "./events/outbox.worker";
import { startUserEventConsumer } from "./events/user.consumer";
import { producer } from "./lib/kafka";
import { logger } from "./lib/logger";

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
