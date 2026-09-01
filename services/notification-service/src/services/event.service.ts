import { prisma } from "../lib/prisma";

export const isEventProcessed = async (eventId: string) => {
  const event = await prisma.processedEvent.findUnique({
    where: {
      eventId,
    },
  });

  return Boolean(event);
};

export const markEventProcessed = async (
  eventId: string,
  eventType: string,
) => {
  await prisma.processedEvent.create({
    data: {
      eventId,
      eventType,
    },
  });
};
