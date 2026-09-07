import crypto from "crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CourseStatus } from "../../src/generated/prisma/enums";
import { prisma } from "../../src/lib/prisma";
import { purchaseCourse } from "../../src/services/purchase.service";
import { generateId } from "../../src/utils/id";

vi.mock("../../src/utils/id", () => ({
  generateId: vi.fn(),
}));

describe("purchaseCourse transaction", () => {
  beforeEach(async () => {
    vi.clearAllMocks();

    await prisma.outboxEvent.deleteMany();
    await prisma.enrollment.deleteMany();
    await prisma.course.deleteMany();
  });

  it("should rollback enrollment if outbox event creation fails", async () => {
    const instructorId = crypto.randomUUID();
    const studentId = crypto.randomUUID();

    const course = await prisma.course.create({
      data: {
        title: "React Course",
        description: "Learn advanced React",
        price: 999,
        status: CourseStatus.PUBLISHED,
        instructorId,
      },
    });

    const duplicateEventId = "00000000-0000-0000-0000-000000000001";

    // Create an existing outbox event with the ID
    // that we'll force purchaseCourse() to use.
    await prisma.outboxEvent.create({
      data: {
        id: duplicateEventId,
        eventType: "TEST_EVENT",
        aggregateId: "test-aggregate",
        payload: {
          test: true,
        },
      },
    });

    vi.mocked(generateId).mockReturnValue(duplicateEventId);

    await expect(purchaseCourse(studentId, course.id)).rejects.toThrow();

    // Enrollment must have been rolled back.
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: studentId,
          courseId: course.id,
        },
      },
    });

    expect(enrollment).toBeNull();

    // Original event must still exist.
    const existingEvent = await prisma.outboxEvent.findUnique({
      where: {
        id: duplicateEventId,
      },
    });

    expect(existingEvent).not.toBeNull();
  });
});
