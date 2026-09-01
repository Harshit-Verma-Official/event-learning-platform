import { COURSE_EVENT_TYPES } from "@event-learning-platform/contracts";
import type { Prisma } from "../generated/prisma/client";

export const createCoursePurchasedEvent = async (
  tx: Prisma.TransactionClient,
  userId: string,
  courseId: string,
  enrollmentId: string,
) => {
  const eventId = crypto.randomUUID();

  await tx.outboxEvent.create({
    data: {
      id: eventId,
      eventType: COURSE_EVENT_TYPES.COURSE_PURCHASED,
      aggregateId: courseId,
      payload: {
        eventId,
        type: COURSE_EVENT_TYPES.COURSE_PURCHASED,
        userId,
        courseId,
        enrollmentId,
        occurredAt: new Date().toISOString(),
      },
    },
  });
};
