import { processOutboxEvents } from "./outbox.publisher";

const POLL_INTERVAL_MS = 1000;

export const startOutboxWorker = () => {
  const poll = async () => {
    try {
      await processOutboxEvents();
    } catch (error) {
      console.error("Outbox worker error:", error);
    }
  };

  void poll();

  setInterval(() => {
    void poll();
  }, POLL_INTERVAL_MS);
};
