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

  it("should allow an instructor to delete their own course", async () => {
    const instructorId = crypto.randomUUID();

    const course = await prisma.course.create({
      data: {
        title: "Course to Delete",
        description: "Course description",
        price: 500,
        instructorId,
      },
    });

    const accessToken = generateAccessToken({
      sub: instructorId,
    });

    await redis.set(getRoleKey(instructorId), "INSTRUCTOR");

    const response = await request(app)
      .delete(`/${course.id}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(204);

    const deletedCourse = await prisma.course.findUnique({
      where: {
        id: course.id,
      },
    });

    expect(deletedCourse).toBeNull();
  });

  it("should reject an instructor from deleting another instructor's course", async () => {
    const ownerId = crypto.randomUUID();
    const otherInstructorId = crypto.randomUUID();

    const course = await prisma.course.create({
      data: {
        title: "Protected Course",
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
      .delete(`/${course.id}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(403);

    const existingCourse = await prisma.course.findUnique({
      where: {
        id: course.id,
      },
    });

    expect(existingCourse).not.toBeNull();
  });

  it("should allow an admin to delete any course", async () => {
    const instructorId = crypto.randomUUID();
    const adminId = crypto.randomUUID();

    const course = await prisma.course.create({
      data: {
        title: "Admin Delete Course",
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
      .delete(`/${course.id}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(204);

    const deletedCourse = await prisma.course.findUnique({
      where: {
        id: course.id,
      },
    });

    expect(deletedCourse).toBeNull();
  });
});
