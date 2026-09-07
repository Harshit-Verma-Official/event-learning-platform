import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { app } from "../../src/app";
import { prisma } from "../../src/lib/prisma";
import { hashPassword } from "../../src/utils/password";

describe("POST /api/v1/auth/login", () => {
  beforeEach(async () => {
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();
  });

  it("should login successfully with valid credentials", async () => {
    const password = "Password123!";

    await prisma.user.create({
      data: {
        name: "Test User",
        email: "test@example.com",
        passwordHash: await hashPassword(password),
      },
    });

    const response = await request(app).post("/api/v1/auth/login").send({
      email: "test@example.com",
      password,
    });

    expect(response.status).toBe(200);

    expect(response.body.user).toMatchObject({
      email: "test@example.com",
      name: "Test User",
    });

    expect(response.body.accessToken).toBeDefined();

    const setCookie = response.headers["set-cookie"];

    expect(setCookie).toBeDefined();
    expect(setCookie).toEqual(
      expect.arrayContaining([expect.stringContaining("refreshToken=")]),
    );

    const refreshToken = await prisma.refreshToken.findFirst({
      where: {
        user: {
          email: "test@example.com",
        },
      },
    });

    expect(refreshToken).not.toBeNull();
  });

  it("should reject invalid password", async () => {
    const password = "Password123!";

    await prisma.user.create({
      data: {
        name: "Test User",
        email: "test@example.com",
        passwordHash: await hashPassword(password),
      },
    });

    const response = await request(app).post("/api/v1/auth/login").send({
      email: "test@example.com",
      password: "WrongPassword123!",
    });

    expect(response.status).toBe(401);
  });

  it("should reject unknown email", async () => {
    const response = await request(app).post("/api/v1/auth/login").send({
      email: "doesnotexist@example.com",
      password: "Password123!",
    });

    expect(response.status).toBe(401);
  });
});
