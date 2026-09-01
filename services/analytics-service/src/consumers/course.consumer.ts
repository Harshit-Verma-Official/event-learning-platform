import type { CoursePurchasedEvent } from "@event-learning-platform/contracts";
import { COURSE_EVENT_TYPES } from "@event-learning-platform/contracts";
import { courseConsumer } from "../lib/kafka";
import { logger } from "../lib/logger";
import {
  isEventProcessed,
  markEventProcessed,
} from "../services/event.service";

const TOPIC = "course-events";

const handleCoursePurchased = async (event: CoursePurchasedEvent) => {
  const processed = await isEventProcessed(event.eventId);

  if (processed) {
    logger.info(`Skipping duplicate event ${event.eventId}`);
    return;
  }

  logger.info(
    `[Analytics] Course ${event.courseId} purchased by ${event.userId}`,
  );

  await markEventProcessed(event.eventId, event.type);
};

export const startCourseAnalyticsConsumer = async () => {
  await courseConsumer.connect();

  await courseConsumer.subscribe({
    topic: TOPIC,
    fromBeginning: false,
  });

  await courseConsumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) {
        return;
      }

      const event = JSON.parse(
        message.value.toString(),
      ) as CoursePurchasedEvent;

      if (event.type === COURSE_EVENT_TYPES.COURSE_PURCHASED) {
        await handleCoursePurchased(event);
      }
    },
  });
};
