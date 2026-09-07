import crypto from "crypto";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { app } from "../../src/app";
import { generateAccessToken } from "../../src/lib/jwt";
import { prisma } from "../../src/lib/prisma";
import { redis } from "../../src/lib/redis";
import { getRoleKey } from "../../src/services/authorization.service";

describe("POST /", () => {
  beforeEach(async () => {
    await prisma.outboxEvent.deleteMany();
    await prisma.course.deleteMany();
    await redis.flushdb();
  });

  it("should allow an instructor to update their own course", async () => {
    const instructorId = crypto.randomUUID();

    const course = await prisma.course.create({
      data: {
        title: "Old Title",
        description: "Old course description",
        price: 500,
        instructorId,
      },
    });

    const accessToken = generateAccessToken({
      sub: instructorId,
    });

    await redis.set(getRoleKey(instructorId), "INSTRUCTOR");

    const response = await request(app)
      .patch(`/${course.id}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        title: "Updated Title",
      });

    expect(response.status).toBe(200);

    expect(response.body.course.title).toBe("Updated Title");
  });

  it("should reject an instructor from updating another instructor's course", async () => {
    const ownerId = crypto.randomUUID();
    const otherInstructorId = crypto.randomUUID();

    const course = await prisma.course.create({
      data: {
        title: "Original Course",
        description: "Course description",
        price: 500,
        instructorId: ownerId,
      },
    });

    const accessToken = generateAccessToken({
      sub: otherInstructorId,
    });

    await redis.set(getRoleKey(otherInstructorId), "INSTRUCTOR");

    const response = await request(app)
      .patch(`/${course.id}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        title: "Hacked Title",
      });

    expect(response.status).toBe(403);

    const unchangedCourse = await prisma.course.findUnique({
      where: {
        id: course.id,
      },
    });

    expect(unchangedCourse?.title).toBe("Original Course");
  });

  it("should allow an admin to update another instructor's course", async () => {
    const instructorId = crypto.randomUUID();
    const adminId = crypto.randomUUID();

    const course = await prisma.course.create({
      data: {
        title: "Original Course",
        description: "Course description",
        price: 500,
        instructorId,
      },
    });

    const accessToken = generateAccessToken({
      sub: adminId,
    });

    await redis.set(getRoleKey(adminId), "ADMIN");

    const response = await request(app)
      .patch(`/${course.id}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        title: "Admin Updated Course",
      });

    expect(response.status).toBe(200);

    expect(response.body.course.title).toBe("Admin Updated Course");
  });
});
