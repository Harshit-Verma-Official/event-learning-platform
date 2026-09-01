import type {
  UserCreatedEvent,
  UserEvent,
} from "@event-learning-platform/contracts";
import { USER_EVENT_TYPES } from "@event-learning-platform/contracts";
import { userConsumer } from "../lib/kafka";
import {
  isEventProcessed,
  markEventProcessed,
} from "../services/event.service";

const USER_EVENTS_TOPIC = "user-events";

const handleUserRegistered = async (event: UserCreatedEvent) => {
  const processed = await isEventProcessed(event.eventId);

  if (processed) {
    console.log(`Skipping duplicate event ${event.eventId}`);
    return;
  }

  console.log(`📧 Sending welcome email to ${event.email}`);
  console.log(`Welcome ${event.name}!`);

  await markEventProcessed(event.eventId, event.type);
};

export const startUserConsumer = async () => {
  await userConsumer.connect();

  await userConsumer.subscribe({
    topic: USER_EVENTS_TOPIC,
    fromBeginning: false,
  });

  await userConsumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) {
        return;
      }

      const event = JSON.parse(message.value.toString()) as UserEvent;

      console.log("Received auth event:", event);

      if (event.type === USER_EVENT_TYPES.USER_CREATED) {
        await handleUserRegistered(event);
      }
    },
  });
};
