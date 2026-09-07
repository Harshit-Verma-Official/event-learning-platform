import type { CoursePurchasedEvent } from "@event-learning-platform/contracts";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { handleCoursePurchased } from "../../src/consumers/course.consumer";

import {
  isEventProcessed,
  markEventProcessed,
} from "../../src/services/event.service";

vi.mock("../../src/services/event.service", () => ({
  isEventProcessed: vi.fn(),
  markEventProcessed: vi.fn(),
}));

describe("Course Kafka consumer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const event: CoursePurchasedEvent = {
    eventId: "event-123",
    type: "COURSE_PURCHASED",
    userId: "user-123",
    courseId: "course-123",
    enrollmentId: "enrollment-123",
    occurredAt: new Date().toISOString(),
  };

  it("should process a new event", async () => {
    vi.mocked(isEventProcessed).mockResolvedValue(false);

    await handleCoursePurchased(event);

    expect(isEventProcessed).toHaveBeenCalledWith("event-123");

    expect(markEventProcessed).toHaveBeenCalledWith(
      "event-123",
      "COURSE_PURCHASED",
    );
  });

  it("should skip an already processed event", async () => {
    vi.mocked(isEventProcessed).mockResolvedValue(true);

    await handleCoursePurchased(event);

    expect(isEventProcessed).toHaveBeenCalledWith("event-123");

    expect(markEventProcessed).not.toHaveBeenCalled();
  });
});
