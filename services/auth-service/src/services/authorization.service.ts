import type { UserRole } from "../generated/prisma/enums";
import { prisma } from "../lib/prisma";
import { redis } from "../lib/redis";

const AUTH_CACHE_TTL = 60 * 60; // 1 hour

const getAuthKey = (userId: string) => {
  return `auth:user:${userId}`;
};

interface AuthorizationState {
  role: UserRole;
}

export const getAuthorizationState = async (
  userId: string,
): Promise<AuthorizationState | null> => {
  const key = getAuthKey(userId);

  // 1. Try Redis first
  const cached = await redis.get(key);

  if (cached) {
    return JSON.parse(cached);
  }

  // 2. Cache miss -> PostgreSQL
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      role: true,
    },
  });

  if (!user) {
    return null;
  }

  const authorizationState = {
    role: user.role,
  };

  // 3. Populate Redis
  await redis.set(
    key,
    JSON.stringify(authorizationState),
    "EX",
    AUTH_CACHE_TTL,
  );

  return authorizationState;
};

export const invalidateAuthorizationState = async (userId: string) => {
  await redis.del(getAuthKey(userId));
};
