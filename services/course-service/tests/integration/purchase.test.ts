import crypto from "crypto";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { app } from "../../src/app";
import { CourseStatus } from "../../src/generated/prisma/enums";
import { generateAccessToken } from "../../src/lib/jwt";
import { prisma } from "../../src/lib/prisma";
import { redis } from "../../src/lib/redis";
import { getRoleKey } from "../../src/services/authorization.service";

describe("POST /:id/purchase", () => {
  beforeEach(async () => {
    await prisma.outboxEvent.deleteMany();
    await prisma.enrollment.deleteMany();
    await prisma.course.deleteMany();
    await redis.flushdb();
  });

  it("should create an enrollment and outbox event", async () => {
    const instructorId = crypto.randomUUID();
    const studentId = crypto.randomUUID();

    const course = await prisma.course.create({
      data: {
        title: "React Course",
        description: "Learn advanced React",
        price: 999,
        instructorId,
        status: CourseStatus.PUBLISHED,
      },
    });

    const accessToken = generateAccessToken({
      sub: studentId,
    });

    await redis.set(getRoleKey(studentId), "STUDENT");

    const response = await request(app)
      .post(`/${course.id}/purchase`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(201);

    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId: studentId,
        courseId: course.id,
      },
    });

    expect(enrollment).not.toBeNull();

    const outboxEvent = await prisma.outboxEvent.findFirst({
      where: {
        aggregateId: course.id,
      },
    });

    expect(outboxEvent).not.toBeNull();
  });
});
