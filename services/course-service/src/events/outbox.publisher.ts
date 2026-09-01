import { producer } from "../lib/kafka";
import { prisma } from "../lib/prisma";

const OUTBOX_BATCH_SIZE = 10;
const TOPIC = "course-events";

export const processOutboxEvents = async () => {
  const events = await prisma.outboxEvent.findMany({
    where: {
      status: "PENDING",
    },
    orderBy: {
      createdAt: "asc",
    },
    take: OUTBOX_BATCH_SIZE,
  });

  for (const event of events) {
    try {
      await producer.send({
        topic: TOPIC,
        messages: [
          {
            key: event.aggregateId,
            value: JSON.stringify(event.payload),
          },
        ],
      });

      await prisma.outboxEvent.update({
        where: {
          id: event.id,
        },
        data: {
          status: "PROCESSED",
          processedAt: new Date(),
        },
      });
    } catch (error) {
      console.error(`Failed to publish outbox event ${event.id}`, error);

      await prisma.outboxEvent.update({
        where: {
          id: event.id,
        },
        data: {
          attempts: {
            increment: 1,
          },
          lastError: error instanceof Error ? error.message : "Unknown error",
        },
      });
    }
  }
};
