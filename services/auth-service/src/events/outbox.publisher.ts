import type { UserEvent } from "@event-learning-platform/contracts";
import { prisma } from "../lib/prisma";
import { producer } from "../lib/kafka";

const USER_EVENTS_TOPIC = "user-events";

export const publishPendingOutboxEvents = async () => {
  const events = await prisma.outboxEvent.findMany({
    where: {
      publishedAt: null,
    },
    take: 100,
  });

  for (const event of events) {
    try {
      const userEvent = event.payload as unknown as UserEvent;

      await producer.send({
        topic: USER_EVENTS_TOPIC,
        messages: [
          {
            key: event.aggregateId,
            value: JSON.stringify(userEvent),
          },
        ],
      });

      await prisma.outboxEvent.update({
        where: {
          id: event.id,
        },
        data: {
          publishedAt: new Date(),
          lastError: null,
        },
      });

      console.log(`Published outbox event ${event.id}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown Kafka error";

      await prisma.outboxEvent.update({
        where: {
          id: event.id,
        },
        data: {
          attempts: {
            increment: 1,
          },
          lastError: message,
        },
      });

      console.error(`Failed to publish outbox event ${event.id}:`, error);
    }
  }
};
