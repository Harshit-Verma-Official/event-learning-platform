import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "../../src/lib/prisma";
import { registerUser } from "../../src/services/auth.service";
import { generateId } from "../../src/utils/id";

vi.mock("../../src/utils/id", () => ({
  generateId: vi.fn(),
}));

describe("registerUser transaction", () => {
  beforeEach(async () => {
    vi.clearAllMocks();

    await prisma.outboxEvent.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.outboxEvent.deleteMany();
    await prisma.user.deleteMany();
  });

  it("should rollback user creation if outbox event creation fails", async () => {
    const duplicateEventId = "00000000-0000-0000-0000-000000000001";

    // Create an existing event with the ID we're going to force.
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

    await expect(
      registerUser({
        name: "Rollback User",
        email: "rollback@example.com",
        password: "Password123!",
      }),
    ).rejects.toThrow();

    // Most important assertion:
    // user creation must have been rolled back.
    const user = await prisma.user.findUnique({
      where: {
        email: "rollback@example.com",
      },
    });

    expect(user).toBeNull();

    // Original event still exists.
    const existingEvent = await prisma.outboxEvent.findUnique({
      where: {
        id: duplicateEventId,
      },
    });

    expect(existingEvent).not.toBeNull();
  });
});
