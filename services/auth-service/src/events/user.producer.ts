import { USER_EVENT_TYPES } from "@event-learning-platform/contracts";
import { randomUUID } from "crypto";
import type { Prisma } from "../generated/prisma/client";
import type { UserRole } from "../generated/prisma/enums";

export const createUserRoleChangedEvent = async (
  tx: Prisma.TransactionClient,
  userId: string,
  role: UserRole,
) => {
  const eventId = randomUUID();

  await tx.outboxEvent.create({
    data: {
      id: eventId,
      eventType: USER_EVENT_TYPES.USER_ROLE_CHANGED,
      aggregateId: userId,
      payload: {
        eventId,
        type: USER_EVENT_TYPES.USER_ROLE_CHANGED,
        userId,
        role,
        occurredAt: new Date().toISOString(),
      },
    },
  });
};
