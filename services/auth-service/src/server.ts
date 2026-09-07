import { app } from "./app";
import { startOutboxWorker } from "./events/outbox.worker";
import { producer } from "./lib/kafka";
import { logger } from "./lib/logger";

const PORT = process.env.PORT || 3001;

const startServer = async () => {
  await producer.connect();

  startOutboxWorker();

  app.listen(PORT, () => {
    logger.info(`Auth service running on port ${PORT}`);
  });
};

startServer();
