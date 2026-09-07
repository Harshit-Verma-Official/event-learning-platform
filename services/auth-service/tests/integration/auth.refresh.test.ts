import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { app } from "../../src/app";
import { generateRefreshToken } from "../../src/lib/jwt";
import { prisma } from "../../src/lib/prisma";
import { hashPassword } from "../../src/utils/password";
import { hashToken } from "../../src/utils/token";

describe("POST /api/v1/auth/refresh", () => {
  beforeEach(async () => {
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();
  });

  it("should rotate the refresh token successfully", async () => {
    const password = "Password123!";

    const user = await prisma.user.create({
      data: {
        name: "Test User",
        email: "test@example.com",
        passwordHash: await hashPassword(password),
      },
    });

    const refreshToken = generateRefreshToken(user.id);
    const familyId = crypto.randomUUID();

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(refreshToken),
        familyId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const response = await request(app)
      .post("/api/v1/auth/refresh")
      .set("Cookie", `refreshToken=${refreshToken}`);

    expect(response.status).toBe(200);
    expect(response.body.accessToken).toBeDefined();

    const tokens = await prisma.refreshToken.findMany({
      where: {
        userId: user.id,
        familyId,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    expect(tokens).toHaveLength(2);

    // Original token was revoked
    expect(tokens[0].revokedAt).not.toBeNull();

    // New token is active
    expect(tokens[1].revokedAt).toBeNull();
  });

  it("should detect refresh token reuse and revoke the token family", async () => {
    const user = await prisma.user.create({
      data: {
        name: "Test User",
        email: "reuse@example.com",
        passwordHash: await hashPassword("Password123!"),
      },
    });

    const refreshToken = generateRefreshToken(user.id);
    const familyId = crypto.randomUUID();

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(refreshToken),
        familyId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // First refresh succeeds and rotates the token.
    const firstResponse = await request(app)
      .post("/api/v1/auth/refresh")
      .set("Cookie", `refreshToken=${refreshToken}`);

    expect(firstResponse.status).toBe(200);

    // Try using the OLD token again.
    const secondResponse = await request(app)
      .post("/api/v1/auth/refresh")
      .set("Cookie", `refreshToken=${refreshToken}`);

    expect(secondResponse.status).toBe(401);

    expect(secondResponse.body.message).toBe(
      "Refresh token reuse detected",
    );

    // The entire token family should now be revoked.
    const tokens = await prisma.refreshToken.findMany({
      where: {
        familyId,
      },
    });

    expect(tokens.length).toBe(2);

    for (const token of tokens) {
      expect(token.revokedAt).not.toBeNull();
    }
  });
});
