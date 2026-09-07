import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../src/app";
import { prisma } from "../../src/lib/prisma";

describe("Auth integration tests", () => {
  beforeAll(async () => {
    await prisma.$connect();

    await prisma.outboxEvent.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("should register a user and create an outbox event", async () => {
    const response = await request(app).post("/api/v1/auth/register").send({
      name: "Test User",
      email: "test@example.com",
      password: "Password123!",
      role: "STUDENT",
    });

    expect(response.status).toBe(201);

    expect(response.body.user).toBeDefined();

    const user = await prisma.user.findUnique({
      where: {
        email: "test@example.com",
      },
    });

    expect(user).not.toBeNull();

    const event = await prisma.outboxEvent.findFirst({
      where: {
        aggregateId: user!.id,
      },
    });

    expect(event).not.toBeNull();

    expect(event!.eventType).toBe("USER_CREATED");
  });
});
