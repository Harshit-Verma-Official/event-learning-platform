import type { CoursePurchasedEvent } from "@event-learning-platform/contracts";
import { consumer } from "../lib/kafka";
import {
  isEventProcessed,
  markEventProcessed,
} from "../services/event.service";

const handleCoursePurchased = async (event: CoursePurchasedEvent) => {
  const processed = await isEventProcessed(event.eventId);

  if (processed) {
    console.log(`Skipping duplicate event ${event.eventId}`);
    return;
  }

  console.log(`📧 Sending purchase confirmation for user ${event.userId}`);
  console.log(`Course: ${event.courseId}`);
  console.log(`Enrollment: ${event.enrollmentId}`);

  await markEventProcessed(event.eventId, event.type);
};

export const startCourseConsumer = async () => {
  await consumer.connect();

  await consumer.subscribe({
    topic: "course-events",
    fromBeginning: false,
  });

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) {
        return;
      }

      const event = JSON.parse(message.value.toString());

      console.log("Received course event:", event);

      if (event.type === "COURSE_PURCHASED") {
        await handleCoursePurchased(event);
      }
    },
  });
};
