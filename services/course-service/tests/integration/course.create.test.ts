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

  it("should create a course for an instructor", async () => {
    const instructorId = crypto.randomUUID();

    const accessToken = generateAccessToken({
      sub: instructorId,
    });

    // Whatever key format your auth middleware actually uses.
    await redis.set(getRoleKey(instructorId), "INSTRUCTOR");

    const response = await request(app)
      .post("/")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        title: "React Advanced Course",
        description: "Advanced React concepts and patterns",
        price: 999,
      });

    expect(response.status).toBe(201);

    expect(response.body.course).toMatchObject({
      title: "React Advanced Course",
      instructorId,
    });

    const course = await prisma.course.findFirst({
      where: {
        instructorId,
      },
    });

    expect(course).not.toBeNull();
  });

  it("should reject a student from creating a course", async () => {
    const studentId = crypto.randomUUID();

    const accessToken = generateAccessToken({
      sub: studentId,
    });

    await redis.set(getRoleKey(studentId), "STUDENT");

    const response = await request(app)
      .post("/")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        title: "React Advanced Course",
        description: "Advanced React concepts and patterns",
        price: 999,
      });

    expect(response.status).toBe(403);

    const course = await prisma.course.findFirst({
      where: {
        instructorId: studentId,
      },
    });

    expect(course).toBeNull();
  });

  it("should reject unauthenticated requests", async () => {
    const response = await request(app).post("/").send({
      title: "React Advanced Course",
      description: "Advanced React concepts and patterns",
      price: 999,
    });

    expect(response.status).toBe(401);
  });
});
