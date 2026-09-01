import type { UserEvent } from "@event-learning-platform/contracts";
import { USER_EVENT_TYPES } from "@event-learning-platform/contracts";
import { consumer } from "../lib/kafka";
import { setUserRole } from "../services/authorization.service";
import {
  isEventProcessed,
  markEventProcessed,
} from "../services/event.service";

const USER_EVENTS_TOPIC = "user-events";

export const startUserEventConsumer = async () => {
  await consumer.connect();

  await consumer.subscribe({
    topic: USER_EVENTS_TOPIC,
    fromBeginning: false,
  });

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) {
        return;
      }

      const event = JSON.parse(message.value.toString()) as UserEvent;
      const alreadyProcessed = await isEventProcessed(event.eventId);

      if (alreadyProcessed) {
        console.log(`Skipping duplicate event ${event.eventId}`);

        return;
      }

      switch (event.type) {
        case USER_EVENT_TYPES.USER_CREATED:
        case USER_EVENT_TYPES.USER_ROLE_CHANGED:
          await setUserRole(event.userId, event.role);
          break;
        default:
          console.warn(`Unknown user event: ${(event as UserEvent).type}`);
          return;
      }

      await markEventProcessed(event.eventId, event.type);
    },
  });
};
