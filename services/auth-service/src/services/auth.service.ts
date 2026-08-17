import crypto from "crypto";
import type { RefreshTokenPayload } from "../lib/jwt";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../lib/jwt";
import { prisma } from "../lib/prisma";
import { comparePassword, hashPassword } from "../utils/password";
import { hashToken } from "../utils/token";

interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export const registerUser = async ({
  name,
  email,
  password,
}: RegisterInput) => {
  const existingUser = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (existingUser) {
    throw new Error("User already exists");
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
    },
  });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
};

export const loginUser = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    throw new Error("Invalid email or password");
  }

  const passwordMatches = await comparePassword(password, user.passwordHash);

  if (!passwordMatches) {
    throw new Error("Invalid email or password");
  }

  const accessToken = generateAccessToken({ sub: user.id, role: user.role });
  const refreshToken = generateRefreshToken(user.id);
  const familyId = crypto.randomUUID();

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      familyId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    accessToken,
    refreshToken,
  };
};

export const refreshAccessToken = async (refreshToken: string) => {
  let payload: RefreshTokenPayload;

  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new Error("Invalid or expired refresh token");
  }

  const userId = payload.sub;
  const tokenHash = hashToken(refreshToken);
  const storedToken = await prisma.refreshToken.findFirst({
    where: {
      tokenHash,
      userId,
    },
    include: {
      user: true,
    },
  });

  if (storedToken === null) {
    throw new Error("Invalid refresh token");
  }

  if (storedToken.expiresAt < new Date()) {
    throw new Error("Refresh token expired");
  }

  if (storedToken.revokedAt) {
    await prisma.refreshToken.updateMany({
      where: {
        familyId: storedToken.familyId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    throw new Error("Refresh token reuse detected");
  }

  if (!storedToken.user) {
    throw new Error("User not found");
  }

  const newRefreshToken = generateRefreshToken(storedToken.user.id);

  await prisma.$transaction(async (tx) => {
    /*
     * Atomically revoke the current refresh token.
     *
     * The WHERE condition is important:
     *
     *   revokedAt: null
     *
     * Only one concurrent request can successfully
     * transition this token from active → revoked.
     */
    const result = await tx.refreshToken.updateMany({
      where: {
        id: storedToken.id,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    /*
     * Another request may have already rotated this token.
     */
    if (result.count === 0) {
      throw new Error("Refresh token reuse detected");
    }

    /*
     * Create the replacement token.
     *
     * Same familyId because this is a rotation
     * of the same login/session.
     */
    await tx.refreshToken.create({
      data: {
        userId: storedToken.user.id,
        tokenHash: hashToken(newRefreshToken),
        familyId: storedToken.familyId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });
  });

  return {
    accessToken: generateAccessToken({
      sub: storedToken.user.id,
      role: storedToken.user.role,
    }),
    refreshToken: newRefreshToken,
  };
};
